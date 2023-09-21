const mongoose = require('mongoose')

mongoose.connect(`${process.env.MONGODB_URL}/${process.env.MONGODB_DB_NAME}`)