const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const { nonExistentUser, userOne, setupDatabase } = require('./fixtures/db')
const { describe } = require('node:test')

const sampleInput = {
    "name": "Briggs Victoria",
    "email": "dev.briggs.victoria@gmail.com",
    "password": "samplepw123"
}

beforeEach(setupDatabase)

describe('POST /users', () => {
    describe('positive', () => {
        it('Should signup a new user', async () => {
            const response = await request(app)
                .post('/users')
                .send(sampleInput)
            expect(response.status).toEqual(201)

            // Assert that the database was changed correctly
            const user = await User.findById(response.body.user._id)
            expect(user).not.toBeNull()

            // Assertions about the response
            const { password, ...assert } = sampleInput
            expect(response.body).toMatchObject({
                user: assert,
                token: user.tokens[0].token
            })
            // Assert password has been saved as plain text
            expect(user.password).not.toBe(password)
        })
    })

    describe('negative', () => {
        it('Should not sign up user with invalid name', () => { })
        it('Should not sign up user with invalid email', () => { })
        it('Should not sign up user with invalid password', () => { })
    })
})

describe('POST /users/login', () => {
    describe('positive', () => {
        it('Should login existing user', async () => {
            const response = await request(app)
                .post('/users/login')
                .send({
                    email: userOne.email,
                    password: userOne.password
                })
            expect(response.status).toEqual(200)

            // Validate new token is saved
            const user = await User.findById(userOne._id)
            expect(response.body.token).toEqual(user.tokens[1].token)
        })
    })

    describe('negative', () => {
        it('Should not login non-existent user', async () => {
            const response = await request(app)
                .post('/users/login')
                .send({
                    email: nonExistentUser.email,
                    password: nonExistentUser.password
                })
            expect(response.status).toEqual(401)
        })
    })
})

describe('GET /users/me', () => {
    describe('positive', () => {
        it('Should get profile for user', async () => {
            const response = await request(app)
                .get('/users/me')
                .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
                .send()
            expect(response.status).toEqual(200)
        })
    })

    describe('negative', () => {
        it('Should not get profile for unauthenticated user', async () => {
            const response = await request(app)
                .get('/users/me')
                .send()
            expect(response.status).toEqual(401)
        })
    })
})

describe('DELETE /users/me', () => {
    describe('positive', () => {
        it('Should delete account for authenticated user', async () => {
            const response = await request(app)
                .delete('/users/me')
                .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
                .send()
            expect(response.status).toEqual(200)

            // Validate user is deleted
            const user = await User.findById(userOne._id)
            expect(user).toBeNull()
        })
    })

    describe('negative', () => {
        it('Should not delete account for unauthenticated user', async () => {
            const response = await request(app)
                .get('/users/me')
                .send()
            expect(response.status).toEqual(401)

            // Validate user is not deleted
            const user = await User.findById(userOne._id)
            expect(user).not.toBeNull()
        })
    })
})

describe('POST /users/me/avatar', () => {
    it('Should upload avatar image', async () => {
        const response = await request(app)
            .post('/users/me/avatar')
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .attach('avatar', 'tests/fixtures/avatar.jpg')
        expect(response.status).toEqual(200)

        // Check that binary data was saved
        const user = await User.findById(userOne._id)
        expect(user.avatar).toEqual(expect.any(Buffer)) // check if binary data stored in buffer
    })
})

describe('PATCH /users/me', () => {
    it('Should update valid user fields', async () => {
        const updatedUserName = 'Sample name'
        const response = await request(app)
            .patch('/users/me')
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .send({
                name: updatedUserName,
            })
        expect(response.status).toEqual(200)

        // Check that user was updated in database
        const user = await User.findById(userOne._id)
        expect(user.name).toBe(updatedUserName)
    })

    it('Should not update invalid user fields', async () => {
        const response = await request(app)
            .patch('/users/me')
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .send({
                location: "Sample location",
            })
        expect(response.status).toEqual(400)
    })
})