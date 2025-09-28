export default async function handler(req, res) {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    // Test the wallet_profile_view API
    const response = await fetch(`${process.env.BASE_URL || 'https://chainmandate.netlify.app'}/api/softproof?action=wallet_profile_view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();
    
    res.status(200).json({
      token,
      status: response.status,
      data,
      hasProfile: !!data.profile,
      profileKeys: data.profile ? Object.keys(data.profile) : null,
    });
  } catch (error) {
    res.status(500).json({
      token,
      error: error.message,
    });
  }
}
