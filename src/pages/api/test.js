export default function handler(req, res) {
  res.status(200).json({ 
    message: 'API is working',
    env: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      blockcypher: process.env.BLOCKCYPHER_TOKEN ? 'Set' : 'Missing',
      alchemy: process.env.ALCHEMY_ETH_URL ? 'Set' : 'Missing',
      jwt: process.env.JWT_SECRET ? 'Set' : 'Missing',
      baseUrl: process.env.BASE_URL ? 'Set' : 'Missing'
    }
  });
}
