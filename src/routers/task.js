const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')

const router = new express.Router()

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(e.message)
    }
})

router.get('/tasks', auth, async (req, res) => {
    const { completed, limit, skip, sortBy } = req.query
    const match = {}
    const sort = {}

    if (completed) match.completed = (completed === 'true')
    
    if(sortBy) {
        const [sortField, sortOrder] = sortBy.split(':')
        sort[sortField] = sortOrder === 'desc' ? -1 : 1
    }

    try {
        // const tasks = await Task.find({ owner: req.user._id })
        // res.status(200).send(tasks)
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(limit),
                skip: parseInt(skip),
                sort,
            }
        })
        res.send(req.user.tasks)
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    try {
        const _id = req.params.id
        // const task = await Task.findById(_id)
        const task = await Task.findOne({ _id, owner: req.user._id })

        if (!task) return res.send(404).send()

        return res.status(200).send(task)
    } catch (e) {
        res.status(500).send()
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) return res.status(400).send({ error: 'Invalid updates!' })

    try {
        // Replace as this bypasses mongoose middleware
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        // const task = await Task.findById(req.params.id)

        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })

        if (!task) return res.status(404).send()

        updates.forEach((update) => task[update] = req.body[update])
        await task.save()
        res.send(task)
    } catch (e) {
        res.status(400).send(e.message)
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        // const deletedTask = await Task.findByIdAndDelete(req.params.id)
        const deletedTask = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })

        if (!deletedTask) return res.status(404).send()

        res.send(deletedTask)
    } catch (e) {
        res.status(500).send(e.message)
    }
})

module.exports = router