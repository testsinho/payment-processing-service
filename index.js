const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

const TOKENIZATION_URL = 'http://localhost:3005/tokenize';
const TRANSACTION_URL = 'http://localhost:3003/transaction';
const EXTERNAL_URL = 'http://localhost:3004/external';

// Procesar pago
app.post('/process', async (req, res) => {
  const { cardData, amount, currency } = req.body;
  try {
    // Tokenizar tarjeta
    const tokenRes = await fetch(TOKENIZATION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardData })
    });
    const { token } = await tokenRes.json();

    // Registrar transacción
    const txRes = await fetch(TRANSACTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency, token, status: 'pending' })
    });
    const tx = await txRes.json();

    // Simular integración externa
    const extRes = await fetch(EXTERNAL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, amount, currency })
    });
    const ext = await extRes.json();

    // Actualizar estado de la transacción
    await fetch(`${TRANSACTION_URL}/${tx.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: ext.status })
    });

    res.json({ transactionId: tx.id, status: ext.status });
  } catch (err) {
    res.status(500).json({ error: 'Payment failed', details: err.message });
  }
});

app.get('/health', (req, res) => res.send('OK'));

app.listen(3002, () => console.log('Payment Processing Service on 3002'));
