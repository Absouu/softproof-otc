import axios from 'axios';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { ethers } from 'ethers';
// const TronWeb = require('tronweb');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

function createSupabaseForToken(token) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase not configured');
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : {},
    },
  });
}

const BLOCKCYPHER_TOKEN = process.env.BLOCKCYPHER_TOKEN;
if (!BLOCKCYPHER_TOKEN) {
  console.warn('BLOCKCYPHER_TOKEN is not defined. BTC confirmations will fail.');
}

const ALCHEMY_ETH_URL = process.env.ALCHEMY_ETH_URL;
if (!ALCHEMY_ETH_URL) {
  console.warn('ALCHEMY_ETH_URL is not defined. ETH confirmations will fail.');
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// TRON utils cache
let tronUtils = null;

// Persist sessions across hot reloads in dev
const g = globalThis;
if (!g.softproofSessions) {
  g.softproofSessions = {};
}
const sessions = g.softproofSessions;
if (!g.userWalletCache) {
  g.userWalletCache = {};
}
const walletCache = g.userWalletCache;

async function loadTronUtils() {
  if (tronUtils) return tronUtils;
  try {
    const tronModule = await import('tronweb');
    const TronWeb = tronModule.default || tronModule;
    tronUtils = TronWeb.utils;
    return tronUtils;
  } catch (error) {
    console.warn('tronweb not available; TRON support disabled.', error.message);
    throw error;
  }
}

async function generateWalletForChain(chain) {
  switch (chain) {
    case 'btc': {
      const ECPair = ECPairFactory(ecc);
      const keyPair = ECPair.makeRandom({ network: bitcoin.networks.bitcoin });
      const pubkey = Buffer.from(keyPair.publicKey);
      const { address } = bitcoin.payments.p2pkh({
        pubkey,
        network: bitcoin.networks.bitcoin,
      });
      const privateKey = keyPair.toWIF();
      return { address, privateKey };
    }
    case 'eth': {
      const wallet = ethers.Wallet.createRandom();
      return { address: wallet.address, privateKey: wallet.privateKey };
    }
    case 'trx': {
      const utils = await loadTronUtils();
      const account = utils.accounts.generateAccount();
      return { address: account.address.base58, privateKey: account.privateKey };
    }
    default:
      throw new Error(`Unsupported chain for wallet generation: ${chain}`);
  }
}

async function getOrCreateUserWallet(userId, chain, client) {
  if (!client) throw new Error('Supabase client missing');
  const cacheKey = `${userId}:${chain}`;
  if (walletCache[cacheKey]) return walletCache[cacheKey];

  const { data: existing, error: selectErr } = await client
    .from('user_wallets')
    .select('id, address, private_key')
    .eq('user_id', userId)
    .eq('chain', chain)
    .maybeSingle();

  if (selectErr && selectErr.code !== 'PGRST116') {
    throw new Error(selectErr.message || 'Failed to fetch wallet');
  }

  if (existing) {
    walletCache[cacheKey] = existing;
    return existing;
  }

  const generated = await generateWalletForChain(chain);
  const { data: inserted, error: insertErr } = await client
    .from('user_wallets')
    .insert([{ user_id: userId, chain, address: generated.address, private_key: generated.privateKey }])
    .select('id, address, private_key')
    .maybeSingle();

  if (insertErr) {
    throw new Error(insertErr.message || 'Failed to store wallet');
  }

  walletCache[cacheKey] = inserted;
  return inserted;
}

async function checkBitcoinPayment(address, expectedAmount, fromAddress) {
  try {
    const response = await axios.get(
      `https://api.blockcypher.com/v1/btc/main/addrs/${address}/full?token=${BLOCKCYPHER_TOKEN}`
    );
    
    const transactions = response.data?.txs || [];
    
    for (const tx of transactions) {
      const inputs = tx.inputs || [];
      const outputs = tx.outputs || [];
      for (const input of inputs) {
        if (input.addresses && input.addresses.includes(fromAddress)) {
          let totalReceived = 0;
          for (const output of outputs) {
            if (output.addresses && output.addresses.includes(address)) {
              totalReceived += Number(output.value || 0);
            }
          }
          const receivedBTC = totalReceived / 100000000;
          if (Math.abs(receivedBTC - expectedAmount) < 0.000001) {
            return {
              found: true,
              txHash: tx.hash,
              amount: receivedBTC,
              confirmations: tx.confirmations || 0
            };
          }
        }
      }
    }
    
    return { found: false };
  } catch (error) {
    if (error.response?.status === 404) {
      return { found: false };
    }
    console.error('Bitcoin payment check error:', error);
    return { found: false, error: error.message };
  }
}

async function checkEthereumPayment(address, expectedAmount, fromAddress) {
  try {
    const checksummedTo = ethers.getAddress(address);
    const checksummedFrom = ethers.getAddress(fromAddress);
    const response = await axios.post(ALCHEMY_ETH_URL, {
      jsonrpc: '2.0',
      id: 1,
      method: 'alchemy_getAssetTransfers',
      params: [{
        fromBlock: '0x0',
        toBlock: 'latest',
        toAddress: checksummedTo,
        fromAddress: checksummedFrom,
        category: ['external'],
        withMetadata: true
      }]
    });
    
    const transfers = response.data.result?.transfers || [];
    const expectedWei = ethers.parseUnits(expectedAmount.toString(), 18);
    
    for (const transfer of transfers) {
      const rawValueHex = transfer.rawContract?.value;
      if (!rawValueHex) continue;
      let amountWei;
      try {
        amountWei = ethers.getBigInt(rawValueHex);
      } catch {
        continue;
      }
      
      if (amountWei === expectedWei) {
    return {
          found: true,
          txHash: transfer.hash,
          amount: Number(ethers.formatUnits(amountWei, 18)),
          confirmations: transfer.metadata?.blockNum ? 
            await getEthConfirmations(transfer.metadata.blockNum) : 0
        };
      }
    }
    
    return { found: false };
  } catch (error) {
    console.error('Ethereum payment check error:', error);
    return { found: false, error: error.message };
  }
}

async function getEthConfirmations(blockNumber) {
  try {
    const response = await axios.post(ALCHEMY_ETH_URL, {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_blockNumber'
    });
    
    const currentBlock = parseInt(response.data.result, 16);
    const txBlock = typeof blockNumber === 'string' && blockNumber.startsWith('0x')
      ? parseInt(blockNumber, 16)
      : parseInt(blockNumber, 10);
    
    return Math.max(0, currentBlock - txBlock);
  } catch {
    return 0;
  }
}

async function getTronConfirmations(blockNumber) {
  try {
    const latestResp = await axios.get('https://api.trongrid.io/v1/blocks', {
      params: { sort: '-number', limit: 1 }
    });
    const latest = latestResp.data?.data?.[0]?.block_header?.raw_data?.number;
    if (typeof latest !== 'number') return 0;
    return Math.max(0, latest - blockNumber);
  } catch {
    return 0;
  }
}

async function checkTronPayment(address, expectedAmount, fromAddress) {
  try {
    const utils = await loadTronUtils();
    const depositHex = address?.startsWith('41') ? address.toLowerCase() : utils.address.toHex(address).toLowerCase();
    const depositBase58 = address?.startsWith('41') ? utils.address.fromHex(address) : address;
    const senderHex = fromAddress?.startsWith('41') ? fromAddress.toLowerCase() : utils.address.toHex(fromAddress).toLowerCase();
    const response = await axios.get(
      `https://api.trongrid.io/v1/accounts/${depositBase58}/transactions`,
      { params: { limit: 50 } }
    );
    
    const transactions = response.data.data || [];
    
    for (const tx of transactions) {
      const contract = tx.raw_data?.contract?.[0]?.parameter?.value;
      if (!contract) continue;
      const toHex = contract.to_address?.toLowerCase();
      const ownerHex = contract.owner_address?.toLowerCase();
      if (toHex === depositHex && ownerHex === senderHex) {
        const amount = contract.amount / 1_000_000;
        if (Math.abs(amount - expectedAmount) < 0.000001) {
          return {
            found: true,
            txHash: tx.txID,
            amount,
            confirmations: await getTronConfirmations(tx.blockNumber ?? 0)
          };
        }
      }
    }
    
    return { found: false };
  } catch (error) {
    console.error('TRON payment check error:', error.response?.data || error.message);
    return { found: false, error: error.message };
  }
}

async function fetchBalanceForProof(proof) {
  if (!proof?.address || !proof?.chain) return null;
  try {
    if (proof.chain === 'btc') {
      const resp = await axios.get(`https://api.blockcypher.com/v1/btc/main/addrs/${proof.address}/balance?token=${BLOCKCYPHER_TOKEN}`);
      return resp.data?.final_balance != null ? resp.data.final_balance / 1e8 : null;
    }
    if (proof.chain === 'eth') {
      const resp = await axios.post(ALCHEMY_ETH_URL, {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [ethers.getAddress(proof.address), 'latest']
      });
      return Number(ethers.formatEther(resp.data?.result || '0x0'));
    }
    if (proof.chain === 'trx') {
      const utils = await loadTronUtils();
      const base58 = proof.address.startsWith('41') ? utils.address.fromHex(proof.address) : proof.address;
      const resp = await axios.get(`https://api.trongrid.io/v1/accounts/${base58}`);
      const rawBalance = resp.data?.data?.[0]?.balance;
      return typeof rawBalance === 'number' ? rawBalance / 1_000_000 : null;
    }
  } catch (error) {
    console.error('Balance fetch error:', error.message);
  }
  return null;
}

async function checkPayment(chain, address, expectedAmount, fromAddress) {
  switch (chain) {
    case 'btc':
      return await checkBitcoinPayment(address, expectedAmount, fromAddress);
    case 'eth':
      return await checkEthereumPayment(address, expectedAmount, fromAddress);
    case 'trx':
      return await checkTronPayment(address, expectedAmount, fromAddress);
    default:
      return { found: false, error: 'Unsupported chain' };
  }
}

function getAuthToken(req) {
  const auth = req.headers.authorization || '';
  const parts = auth.split(' ');
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
  return '';
}

async function getUserFromToken(token) {
  if (!supabase || !token) return null;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) return null;
    return data?.user || null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  // Handle OPTIONS for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const action = req.query.action;

  try {
    // Initiate proof - generate unique address
    if (action === 'initiate') {
      const tokenHeader = getAuthToken(req);
      const user = await getUserFromToken(tokenHeader);
      if (!user) return res.status(401).json({ error: 'Login required before creating a proof' });
      const userClient = createSupabaseForToken(tokenHeader);

      const { wa, chain, baseAmount } = req.body || {};
      if (!wa || !chain || !baseAmount) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const normalizedChain = String(chain).toLowerCase();
      if (!['btc', 'eth', 'trx'].includes(normalizedChain)) {
        return res.status(400).json({ error: 'Unsupported chain' });
      }

      const sessionId = crypto.randomBytes(16).toString('hex');
      const expectedAmount = parseFloat(Number(baseAmount).toFixed(8));

      try {
        const walletRecord = await getOrCreateUserWallet(user.id, normalizedChain, userClient);
        const depositAddress = walletRecord.address;

        const sessionData = {
          expectedAmount,
          depositAddress,
          claimedWa: wa,
          chain: normalizedChain,
          token: normalizedChain.toUpperCase(),
          createdAt: new Date().toISOString(),
          verified: false,
          userId: user.id,
        };

        sessions[sessionId] = sessionData;

        if (userClient) {
          try {
            await userClient.from('proof_sessions').upsert({
              session_id: sessionId,
              user_id: user.id,
              expected_amount: expectedAmount,
              deposit_address: depositAddress,
              claimed_wallet: wa,
              chain: normalizedChain,
              token: normalizedChain.toUpperCase(),
              created_at: new Date().toISOString(),
              verified: false,
            });
          } catch (dbError) {
            console.error('Supabase session storage error:', dbError);
          }
        }

        res.json({
          sessionId,
          expectedAmount,
          depositAddress,
          instructions: `Send exactly ${expectedAmount} ${normalizedChain.toUpperCase()} from ${wa} to ${depositAddress}. We'll check for the payment every 30 seconds.`,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      return;
    }

    // Check payment status
    if (action === 'check_status') {
      const tokenHeader = getAuthToken(req);
      const user = await getUserFromToken(tokenHeader);
      if (!user) return res.status(401).json({ error: 'Login required' });
      const userClient = createSupabaseForToken(tokenHeader);

      const { sessionId } = req.body || {};
      if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

      let session = sessions[sessionId];

      if (!session && supabase) {
        try {
          const { data, error } = await userClient
            .from('proof_sessions')
            .select('*')
            .eq('session_id', sessionId)
            .eq('user_id', user.id)
            .maybeSingle();

          if (!error && data) {
            session = {
              expectedAmount: data.expected_amount,
              depositAddress: data.deposit_address,
              claimedWa: data.claimed_wallet,
              chain: data.chain,
              token: data.token,
              createdAt: data.created_at,
              verified: data.verified,
              userId: data.user_id,
            };
            sessions[sessionId] = session;
          }
        } catch (dbError) {
          console.error('Supabase session load error:', dbError);
        }
      }

      if (!session || session.userId !== user.id) return res.status(400).json({ error: 'Invalid or unauthorized session' });

      // Check if already verified
      if (session.verified) {
        return res.json({
          verified: true,
          message: `Payment confirmed! Your wallet ${session.claimedWa} has been verified.`
        });
      }

      // Check for payment
      const paymentCheck = await checkPayment(
        session.chain,
        session.depositAddress,
        session.expectedAmount,
        session.claimedWa
      );

      if (paymentCheck.found) {
        // Mark as verified
        session.verified = true;
        session.txHash = paymentCheck.txHash;
        session.confirmations = paymentCheck.confirmations;
        
        // Update Supabase
        if (userClient) {
          try {
            await userClient
              .from('proof_sessions')
              .update({ 
                verified: true,
                tx_hash: paymentCheck.txHash,
                confirmations: paymentCheck.confirmations,
                verified_at: new Date().toISOString()
              })
              .eq('session_id', sessionId)
              .eq('user_id', user.id);
          } catch (dbError) {
            console.error('Supabase verification update error:', dbError);
          }
        }

      // Store proof in Supabase with rate limiting
      let proofStored = false;
      let proofError = null;
      let proofId = null;

        if (userClient && user) {
        try {
            // Rate limit: 5 proofs per 24h
            const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { count, error: cntErr } = await userClient
              .from('proofs')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .gte('verified_at', since);

            if (!cntErr && typeof count === 'number' && count >= 5) {
              proofError = 'Rate limit: max 5 proofs per 24h';
            } else {
              const { data: ins, error: insErr } = await userClient
                .from('proofs')
                .insert([{
                  user_id: user.id,
                  address: session.claimedWa,
                  chain: session.chain,
                  token: session.token,
                  challenge_amount: session.expectedAmount,
                  deposit_address: session.depositAddress,
                  tx_hash: paymentCheck.txHash,
                  verified_at: new Date().toISOString(),
                }])
                .select('id')
                .maybeSingle();

              if (insErr) {
                proofError = insErr.message;
              } else {
                proofStored = true;
                proofId = ins?.id || null;
            }
          }
        } catch (e) {
          proofError = String(e?.message || e);
        }
      }

        return res.json({
          verified: true,
          txHash: paymentCheck.txHash,
          confirmations: paymentCheck.confirmations,
          message: `Controls ${session.claimedWa} with funds ≥${session.expectedAmount} ${String(session.token).toUpperCase()}`,
        proofStored,
        proofId,
        proofError,
      });
      }

      return res.json({
        verified: false,
        message: paymentCheck.error || 'Payment not found yet. Checking every 30 seconds...'
      });
    }

    // Auth endpoints
    if (action === 'signup') {
      if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
      const { email, password } = req.body || {};
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return res.status(400).json({ error: error.message });
      return res.json(data);
    }

    if (action === 'login') {
      if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
      const { email, password } = req.body || {};
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return res.status(400).json({ error: error.message });
      return res.json(data);
    }

    if (action === 'dashboard') {
      if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
      const tokenHeader = getAuthToken(req);
      const user = await getUserFromToken(tokenHeader);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const userClient = createSupabaseForToken(tokenHeader);

      const { data: proofsRaw, error: pErr } = await userClient
        .from('proofs')
        .select(`*,
          wallet_profiles(share_token, published, phone, email, telegram, note)
        `)
        .eq('user_id', user.id)
        .order('verified_at', { ascending: false });
      if (pErr && pErr.code !== 'PGRST116') {
        console.error('Dashboard proofs fetch error:', pErr.message);
      }

      const proofsWithBalances = await Promise.all((proofsRaw || []).map(async (proof) => {
        const balance = await fetchBalanceForProof(proof);
        return {
          ...proof,
          balance,
          wallet_profiles: proof.wallet_profiles || [],
        };
      }));

      return res.json({
        proofs: proofsWithBalances,
        user,
      });
    }

    if (action === 'wallet_profile_upsert') {
      if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
      const tokenHeader = getAuthToken(req);
      const user = await getUserFromToken(tokenHeader);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const userClient = createSupabaseForToken(tokenHeader);
      const { proofId, phone, email, telegram, note, published } = req.body || {};
      if (!proofId) return res.status(400).json({ error: 'Missing proofId' });
      const payload = {
        user_id: user.id,
        proof_id: proofId,
        phone: phone ?? null,
        email: email ?? null,
        telegram: telegram ?? null,
        note: note ?? null,
        updated_at: new Date().toISOString(),
      };
      if (typeof published === 'boolean') {
        payload.published = published;
      }
      const { error } = await userClient
        .from('wallet_profiles')
        .upsert(payload, { onConflict: 'user_id,proof_id' });
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true });
    }

    if (action === 'wallet_profile_delete') {
      if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
      const tokenHeader = getAuthToken(req);
      const user = await getUserFromToken(tokenHeader);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const userClient = createSupabaseForToken(tokenHeader);
      const { proofId } = req.body || {};
      if (!proofId) return res.status(400).json({ error: 'Missing proofId' });
      const { error } = await userClient
        .from('wallet_profiles')
        .delete()
        .eq('user_id', user.id)
        .eq('proof_id', proofId);
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true });
    }

    if (action === 'wallet_profile_share') {
      if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
      const tokenHeader = getAuthToken(req);
      const user = await getUserFromToken(tokenHeader);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const userClient = createSupabaseForToken(tokenHeader);
      const { proofId, copyOnly } = req.body || {};
      if (!proofId) return res.status(400).json({ error: 'Missing proofId' });

      if (copyOnly) {
        const { data: existing, error: existingErr } = await userClient
          .from('wallet_profiles')
          .select('share_token')
          .eq('user_id', user.id)
          .eq('proof_id', proofId)
          .maybeSingle();
        if (existingErr) return res.status(400).json({ error: existingErr.message });
        if (!existing?.share_token) return res.status(400).json({ error: 'Wallet not published yet' });
        return res.json({ shareLink: `/profile/${existing.share_token}`, copied: true });
      }

      let share_token = crypto.randomBytes(16).toString('hex');
      const { data, error } = await userClient
        .from('wallet_profiles')
        .upsert({
          user_id: user.id,
          proof_id: proofId,
          share_token,
          published: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,proof_id' })
        .select('share_token')
        .maybeSingle();
      if (error) return res.status(400).json({ error: error.message });
      if (!data) return res.status(400).json({ error: 'Wallet profile not found' });
      share_token = data.share_token || share_token;
      return res.json({ shareLink: `/profile/${share_token}` });
    }

    if (action === 'wallet_note_update') {
      if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
      const tokenHeader = getAuthToken(req);
      const user = await getUserFromToken(tokenHeader);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const userClient = createSupabaseForToken(tokenHeader);
      const { proofId, note } = req.body || {};
      if (!proofId) return res.status(400).json({ error: 'Missing proofId' });
      const { error } = await userClient
        .from('proofs')
        .update({ note: note ?? null, updated_at: new Date().toISOString() })
        .eq('id', proofId)
        .eq('user_id', user.id);
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true });
    }

    if (action === 'wallet_profile_list') {
      if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
      const { data, error } = await supabase
        .from('wallet_profiles')
        .select('id, user_id, proof_id, share_token, published, phone, email, telegram, note, proofs!inner(id, address, chain, token, challenge_amount, verified_at, tx_hash, note)')
        .eq('published', true);
      if (error) return res.status(400).json({ error: error.message });

      const enriched = await Promise.all((data || []).map(async (row) => {
        const balance = await fetchBalanceForProof(row.proofs);
        return {
          ...row,
          proofs: {
            ...row.proofs,
            balance,
            wallet_note: row.note ?? row.proofs?.note ?? null,
          },
        };
      }));

      return res.json({ profiles: enriched || [] });
    }

    if (action === 'wallet_profile_view') {
      const { token: viewToken } = req.body || {};
      if (!viewToken) return res.status(400).json({ error: 'Missing token' });
      if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
      const { data, error } = await supabase
        .from('wallet_profiles')
        .select('user_id, phone, email, telegram, note, proofs!inner(address, chain, token, challenge_amount, verified_at, tx_hash, note)')
        .eq('share_token', viewToken)
        .eq('published', true)
        .maybeSingle();
      if (error) return res.status(400).json({ error: error.message });
      if (!data) return res.status(404).json({ error: 'Profile not found' });

      let balance = null;
      try {
        balance = await fetchBalanceForProof(data.proofs);
      } catch (error) {
        console.error('Profile balance fetch error:', error.message);
      }

      return res.json({
        profile: {
          phone: data.phone ?? null,
          email: data.email ?? null,
          telegram: data.telegram ?? null,
          note: data.note ?? data.proofs?.note ?? null,
          proofs: {
            ...data.proofs,
            balance,
            wallet_note: data.note ?? data.proofs?.note ?? null,
          },
        },
      });
    }

    if (action === 'intermediary_invite') {
      if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
      const tokenHeader = getAuthToken(req);
      const user = await getUserFromToken(tokenHeader);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const userClient = createSupabaseForToken(tokenHeader);
      const { email } = req.body || {};
      if (!email) return res.status(400).json({ error: 'Email required' });
      const invite_token = crypto.randomBytes(16).toString('hex');
      const { data, error } = await userClient
        .from('intermediaries')
        .insert([{ user_id: user.id, invited_email: email, invite_token }])
        .select('id, invite_token')
        .maybeSingle();
      if (error) return res.status(400).json({ error: error.message });
      const inviteLink = `${BASE_URL}/invite/${invite_token}`;
      return res.json({ inviteLink, intermediaryId: data?.id });
    }

    if (action === 'intermediary_assign') {
      if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
      const tokenHeader = getAuthToken(req);
      const user = await getUserFromToken(tokenHeader);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const userClient = createSupabaseForToken(tokenHeader);
      const { proofId, intermediaryIds = [] } = req.body || {};
      if (!proofId) return res.status(400).json({ error: 'proofId required' });
      await userClient
        .from('wallet_intermediaries')
        .delete()
        .eq('proof_id', proofId);
      if (intermediaryIds.length > 0) {
        const payload = intermediaryIds.map((id) => ({ proof_id: proofId, intermediary_id: id }));
        const { error } = await userClient.from('wallet_intermediaries').insert(payload);
        if (error) return res.status(400).json({ error: error.message });
      }
      return res.json({ success: true });
    }

    if (action === 'intermediary_list') {
      if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
      const tokenHeader = getAuthToken(req);
      const user = await getUserFromToken(tokenHeader);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const userClient = createSupabaseForToken(tokenHeader);
      const { data, error } = await userClient
        .from('intermediaries')
        .select('id, invited_email, supabase_user_id, status, note, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ intermediaries: data || [] });
    }

    if (action === 'wallet_intermediary_list') {
      if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
      const tokenHeader = getAuthToken(req);
      const user = await getUserFromToken(tokenHeader);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const userClient = createSupabaseForToken(tokenHeader);
      const { data, error } = await userClient
        .from('wallet_intermediaries')
        .select('proof_id, intermediary_id, intermediaries(id, invited_email, supabase_user_id, status, note), proofs(user_id)')
        .eq('proofs.user_id', user.id)
        .order('proof_id', { ascending: true })
        .order('intermediary_id', { ascending: true });
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ assignments: data || [] });
    }

    if (action === 'intermediary_accept') {
      if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
      const { inviteToken } = req.body || {};
      const tokenHeader = getAuthToken(req);
      const supaUser = await getUserFromToken(tokenHeader);
      if (!inviteToken) return res.status(400).json({ error: 'Missing inviteToken' });
      if (!supaUser) return res.status(401).json({ error: 'Login required to accept invite' });
      const { data, error } = await supabase
        .from('intermediaries')
        .update({ supabase_user_id: supaUser.id, status: 'accepted', updated_at: new Date().toISOString() })
        .eq('invite_token', inviteToken)
        .eq('status', 'pending')
        .select('id')
        .maybeSingle();
      if (error) return res.status(400).json({ error: error.message });
      if (!data) return res.status(404).json({ error: 'Invite not found or already accepted' });
      return res.json({ success: true });
    }

    if (action === 'intermediary_update') {
      if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
      const tokenHeader = getAuthToken(req);
      const user = await getUserFromToken(tokenHeader);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const userClient = createSupabaseForToken(tokenHeader);
      const { intermediaryId, note } = req.body || {};
      if (!intermediaryId) return res.status(400).json({ error: 'Missing intermediaryId' });
      const { error } = await userClient
        .from('intermediaries')
        .update({ note: note ?? null, updated_at: new Date().toISOString() })
        .eq('id', intermediaryId)
        .eq('user_id', user.id);
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true });
    }

    // Profile sharing
    if (action === 'share_profile') {
      const token = getAuthToken(req);
      const user = await getUserFromToken(token);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const share = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ shareLink: `/profile/${share}` });
    }

    if (action === 'profile_view') {
      const { token: viewToken } = req.body || {};
      if (!viewToken) return res.status(400).json({ error: 'Missing token' });

      let payload;
      try {
        payload = jwt.verify(viewToken, JWT_SECRET);
      } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

      const { data: proofs, error: pErr } = await supabase
        .from('proofs')
        .select('*')
        .eq('user_id', payload.userId);
      if (pErr) return res.status(400).json({ error: pErr.message });

      const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', payload.userId)
        .maybeSingle();
      if (profErr) return res.status(400).json({ error: profErr.message });

      return res.json({ proofs: proofs || [], profile: profile || null });
    }

    if (action === 'submit') {
      const token = getAuthToken(req);
      const user = await getUserFromToken(token);
      if (!user) return res.status(401).json({ error: 'Login required' });

      const { sessionId, txHash } = req.body || {};
      if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });
      if (!txHash) return res.status(400).json({ error: 'Missing txHash' });

      const session = sessions[sessionId];
      if (!session || session.userId !== user.id) return res.status(400).json({ error: 'Invalid session' });

      return res.json({ message: 'Manual submission not required. Waiting for automatic polling.' });
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (e) {
    console.error('API error:', e);
    res.status(500).json({ error: String(e?.message || e) });
  }
}

export const config = { api: { bodyParser: true } };