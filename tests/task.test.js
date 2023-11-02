const request = require('supertest')
const app = require('../src/app')
const Task = require('../src/models/task')
const { userOne, userTwo, taskOne, setupDatabase } = require('./fixtures/db')

beforeEach(setupDatabase)

describe('POST /tasks', () => {
    describe('positive', () => {
        it('Should create task for user', async () => {
            const createdTask = {
                description: "Test task"
            }
            const response = await request(app)
                .post('/tasks')
                .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
                .send(createdTask)
            expect(response.status).toEqual(201)

            // Assert that the database was changed correctly
            const task = await Task.findById(response.body._id)
            expect(task).not.toBeNull()
            expect(task.completed).toEqual(false)
            expect(task.owner).toEqual(userOne._id)
        })
    })

    describe('negative', () => {
        it('Should not create task with invalid description', () => { })
    })
})

describe('PATCH /tasks/:id', () => {
    describe('positive', () => {
        it('Should update task', () => { })
    })
    describe('negative', () => {
        it('Should not update task with invalid description', () => { })
        it('Should not update task of another user', () => { })
    })
})

describe('GET /tasks', () => {
    describe('positive', () => {
        it('Should get all tasks for current user', async () => {
            const response = await request(app)
                .get('/tasks')
                .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
                .send()
            expect(response.status).toEqual(200)

            // Assert that only tasks owned by user are fetched
            expect(response.body.length).toEqual(2)
        })
        it('Should only fetch completed tasks', () => {})
        it('Should only fetch incomplete tasks', () => {})
        it('Should short tasks by description', () => {})
        it('Should short tasks by completed', () => {})
        it('Should short tasks by createdAt', () => {})
        it('Should short tasks by updatedAt', () => {})
        it('Should fetch specified page of tasks', () => {})
    })

    describe('negative', () => {

    })
})

describe('GET /tasks/:id', () => {
    describe('positive', () => {
        it('Should fetch task of current user by id', () => {})
    })
    describe('negative', () => {
        it('Should not fetch task by id if unauthenticated', () => {})
        it('Should not fetch task of another user by id', () => {})
    })
})

describe('DELETE /tasks/:id', () => {
    describe('positive', () => {
        it('Should delete task for current user', () => {})
    })

    describe('negative', () => {
        it('Should not delete task of another user', async () => {
            const response = await request(app)
                .delete(`/tasks/${taskOne._id}`)
                .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
                .send()
            expect(response.status).toEqual(404)

            // Assert that task is still in database
            const task = await Task.findById(taskOne._id)
            expect(task).not.toBeNull()
        })
        it('Should not delete task if unauthenticated', () => {})
    })
})