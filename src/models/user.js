const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        unique: true,
        index: true,
        required: true,
        trim: true,
        lowercase: true,
        validate: {
            validator(v) {
                return validator.isEmail(v)
            },
            message: props => `${props.value} is invalid`
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate: {
            validator(v) {
                return !v.toLowerCase().includes('password')
            },
            message: props => `${props.value} cannot contain 'password'`
        }
    },
    age: {
        type: Number,
        default: 0,
        validate: {
            validator(v) {
                return v >= 0;
            },
            message: props => `${props.value} cannot be negative`
        },
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

/**
 * set up a virtual property
 * not actual data stored in the database
 * a relationship between two entities
 */
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)

    user.tokens = [...user.tokens, { token }]
    await user.save()

    return token
}

/**
 * this needs to match toJSON method name
 * when we use response.send, JSON.stringify gets called on the user
 * we set up a toJSON method on the user to manipulate the object
 * sending back just the properties we want to expose
 */
userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })

    if (!user) throw new Error('Unable to login')

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) throw new Error('Unable to login')

    return user
}

// MIDDLEWARE
// Hash the plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this // document being saved
    const saltRounds = 8

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, saltRounds)
    }

    next()
})

// Delete user tasks when user is removed
userSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    const user = this
    await Task.deleteMany({ owner: user._id })
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User;