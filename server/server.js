require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200
};

const authRoutes = require('./routes/auth');
const onHoldRoutes = require('./routes/onHold');
const activeRoutes = require('./routes/active');
const billingRoutes = require('./routes/billing');
const salesRoutes = require('./routes/sales');
const adminRoutes = require('./routes/admin');

const seed = require('./utils/seed');

const app = express();
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 5001;

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/ruby_auto_parts", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('MongoDB connected');
    await seed();
  })
  .catch(err => console.error('MongoDB connect error', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/onhold', onHoldRoutes);
app.use('/api/active', activeRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => res.send('RAP Server running'));

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
