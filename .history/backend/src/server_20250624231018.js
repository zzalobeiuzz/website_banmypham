require('dotenv').config({ path: __dirname + '/../private.env' });
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

});
