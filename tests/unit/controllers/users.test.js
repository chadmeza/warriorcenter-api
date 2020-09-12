const httpMocks = require("node-mocks-http");
const bcrypt = require("bcryptjs");

const usersController = require("../../../controllers/users");
const User = require("../../../models/user");

let req, res, next;
let users;

describe("eventsController", () => {
    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        next = jest.fn();

        bcrypt.hash = jest.fn();
        bcrypt.compare = jest.fn();

        usersController.sendEmail = jest.fn();
        
        User.create = jest.fn();
        User.findOne = jest.fn();
        User.updateOne = jest.fn();

        users = [
            {
                email: "test1@test.com",
                password: "123456",
                isApproved: false
            },
            {
                email: "test2@test.com",
                password: "123456",
                isApproved: true
            }
        ];
    });

    describe("createUser", () => {
        it("should hash the user's password before saving it", async () => {
            req.body = {
                email: users[0].email,
                password: users[0].password
            };

            await usersController.createUser(req, res, next);

            expect(bcrypt.hash.mock.calls[0][0]).toBe(users[0].password);
        });
        
        it("should return a 201 status with the new user and email response", async () => {
            User.create.mockReturnValue(users[0]);
            usersController.sendEmail.mockReturnValue("Test");

            await usersController.createUser(req, res, next);

            expect(res.statusCode).toBe(201);
            expect(res._getJSONData()).toHaveProperty("newUser");
            expect(res._getJSONData().newUser).toMatchObject(users[0]);
            expect(res._getJSONData()).toHaveProperty("emailResponse");
        });

        it("should return a 500 error if there's a problem with the query", async () => {
            User.create.mockRejectedValue(new Error("Test"));

            await usersController.createUser(req, res, next);

            expect(res.statusCode).toBe(500);
            expect(res._getJSONData()).toHaveProperty("error");
        });
    });

    describe("loginUser", () => {
        it("should return a 404 status if no user account matches the given email", async () => {
            User.findOne.mockReturnValue(null);

            await usersController.loginUser(req, res, next);

            expect(res.statusCode).toBe(404);
            expect(res._getJSONData()).toHaveProperty("error");
        });

        it("should return a 401 status if the user account has not been approved", async () => {
            User.findOne.mockReturnValue(users[0]);

            await usersController.loginUser(req, res, next);

            expect(res.statusCode).toBe(401);
            expect(res._getJSONData()).toHaveProperty("error");
        });

        it("should return a 401 status if the given password does not match the user's password", async () => {
            User.findOne.mockReturnValue(users[1]);
            bcrypt.compare.mockReturnValue(false);

            await usersController.loginUser(req, res, next);

            expect(res.statusCode).toBe(401);
            expect(res._getJSONData()).toHaveProperty("error");
        });

        it("should return a 200 status with a token, token expiration, and the logged-in user's ID", async () => {
            User.findOne.mockReturnValue(new User(users[1]));
            bcrypt.compare.mockReturnValue(true);

            await usersController.loginUser(req, res, next);

            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toHaveProperty("token");
            expect(res._getJSONData()).toHaveProperty("expiresIn");
            expect(res._getJSONData()).toHaveProperty("userId");
        });
    });

    describe("forgotPassword", () => {
        it("should return a 404 status if no user account matches the given email", async () => {
            User.findOne.mockReturnValue(null);

            await usersController.forgotPassword(req, res, next);

            expect(res.statusCode).toBe(404);
        });

        it("should return a 401 status if the user account is not updated with a new password", async () => {
            User.findOne.mockReturnValue(users[0]);
            User.updateOne.mockReturnValue({ n: 0 });

            await usersController.forgotPassword(req, res, next);

            expect(res.statusCode).toBe(401);
        });

        it("should return a 200 status with the update result and email response", async () => {
            User.findOne.mockReturnValue(users[0]);
            User.updateOne.mockReturnValue({ n: 1 });

            await usersController.forgotPassword(req, res, next);

            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toHaveProperty("user");
            expect(res._getJSONData()).toHaveProperty("emailResponse");
        });

        it("should return a 500 error if there's a problem with the query", async () => {
            User.findOne.mockRejectedValue(new Error("Test"));

            await usersController.forgotPassword(req, res, next);

            expect(res.statusCode).toBe(500);
            expect(res._getJSONData()).toHaveProperty("error");
        });
    });

    describe("changePassword", () => {
        beforeEach(() => {
            req.userData = {
                userId: 1
            };
        });

        it("should return a 404 status if a user account cannot be found for the logged in user", async () => {
            User.findOne.mockReturnValue(null);

            await usersController.changePassword(req, res, next);

            expect(res.statusCode).toBe(404);
        });

        it("should return a 401 status if the user account is not updated with a new password", async () => {
            User.findOne.mockReturnValue(users[0]);
            User.updateOne.mockReturnValue({ n: 0 });

            await usersController.changePassword(req, res, next);

            expect(res.statusCode).toBe(401);
        });

        it("should return a 200 status with the result of the user update", async () => {
            User.findOne.mockReturnValue(users[0]);
            User.updateOne.mockReturnValue({ n: 1 });

            await usersController.changePassword(req, res, next);

            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toHaveProperty("user");
        });

        it("should return a 500 error if there's a problem with the query", async () => {
            User.findOne.mockRejectedValue(new Error("Test"));

            await usersController.changePassword(req, res, next);

            expect(res.statusCode).toBe(500);
            expect(res._getJSONData()).toHaveProperty("error");
        });
    });
});