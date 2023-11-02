const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account')

const router = new express.Router()

router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        const token = await user.generateAuthToken()
        await sendWelcomeEmail(user.email, user.name)
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e.message)
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (e) {
        res.status(401).send(e.message)
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token)
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.status(200).send(req.user)
    // try {
    //     const users = await User.find({})
    //     res.status(200).send(users)
    // } catch (e) {
    //     res.status(500).send()
    // }
})

// Deprecated
// router.get('/users/:id', auth, async (req, res) => {
//     try {
//         const _id = req.params.id
//         const user = await User.findById(_id)

//         if (!user) return res.send(404).send()

//         return res.status(200).send(user)
//     } catch (e) {
//         res.status(500).send()
//     }
// })

// Deprecated
// router.patch('/users/:id', auth, async (req, res) => {
//     const updates = Object.keys(req.body)
//     const allowedUpdates = ['name', 'email', 'password', 'age']
//     const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

//     if (!isValidOperation) return res.status(400).send({ error: 'Invalid updates!' })

//     try {
//         // Replace as this bypasses mongoose middleware
//         // const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

//         const user = await User.findById(req.params.id)
//         updates.forEach((update) => user[update] = req.body[update])
//         await user.save()

//         if (!user) return res.status(404).send()

//         res.send(user)
//     } catch (e) {
//         res.status(400).send(e.message)
//     }
// })

// Deprecated
// router.delete('/users/:id', auth, async (req, res) => {
//     try {
//         const deletedUser = await User.findByIdAndDelete(req.params.id)

//         if (!deletedUser) return res.status(404).send()

//         res.send(deletedUser)
//     } catch (e) {
//         res.status(500).send(e.message)
//     }
// })

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) return res.status(400).send({ error: 'Invalid updates!' })

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e.message)
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.deleteOne()
        sendCancellationEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send(e.message)
    }
})

const upload = multer({
    // dest: 'avatars',
    limits: {
        fileSize: 1000000 // in bytes
    },
    fileFilter(req, file, cb) {
        const { originalname } = file
        if (!originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'))
        }

        cb(undefined, true)
    }
})

router.post('/users/me/avatar',
    auth,
    upload.single('avatar'),
    async (req, res) => {
        // modify image before saving to normalize resolution and file format
        const buffer = await sharp(req.file.buffer)
            .resize({ width: 250, height: 250 })
            .png()
            .toBuffer()

        req.user.avatar = buffer
        await req.user.save()
        res.send()
    },
    (error, req, res, next) => {
        res.status(400).send({ error: error.message })
    }
)

router.delete('/users/me/avatar',
    auth,
    async (req, res) => {
        try {
            req.user.avatar = undefined
            await req.user.save()
            res.send()
        } catch (e) {
            res.status(500).send(e.message)
        }
    },
)

router.get('/users/:id/avatar',
    async (req, res) => {
        try {
            const user = await User.findById(req.params.id)

            if (!user || !user.avatar) throw new Error()

            res.set('Content-Type', 'image/png')
            res.send(user.avatar)
        } catch (e) {
            res.status(404).send(e.message)
        }
    }
)

module.exports = router