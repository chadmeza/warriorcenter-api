const request = require("supertest");

const User = require("../../../models/user");

let server;
let users;

describe("/api/users", () => {
    beforeEach(async () => {
        server = require("../../../server");

        users = [
            new User({
                email: "test1@test.com",
                password: "123456",
                isApproved: false
            }),
            new User({
                email: "test2@test.com",
                password: "123456",
                isApproved: true
            })
        ];

        await User.create(users);
    });

    afterEach(async () => {
        await server.close();
        await User.remove({});
    });

    describe("POST /signup", () => {
        it("should return a 201 status with the new user and email response", async () => {
            const testUser = {
                email: "test@test.com",
                password: "123456"
            };

            const res = await request(server).post("/api/users/signup").send(testUser);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty("newUser");
            expect(res.body.newUser).toHaveProperty("email", testUser.email);
            expect(res.body).toHaveProperty("emailResponse");
        });

        it("should return a 500 error if the request is sent with invalid data", async () => {
            const res = await request(server).post("/api/users/signup");

            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty("error");
        });
    });

    describe("POST /login", () => {
        it("should return a 404 status if no user accounts match the given email address", async () => {
            const res = await request(server).post("/api/users/login").send({ email: "test@test.com" });

            expect(res.status).toBe(404);
        });

        it("should return a 401 status if the user has not been approved", async () => {
            const res = await request(server).post("/api/users/login").send(users[0]);

            expect(res.status).toBe(401);
        });
    });

    describe("POST /forgot-password", () => {
        it("should return a 200 status with the result of the user password update and the email response", async () => {
            const res = await request(server).post("/api/users/forgot-password").send({ email: users[0].email });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("user");
            expect(res.body).toHaveProperty("emailResponse");
        });

        it("should return a 404 status if no user accounts match the given email address", async () => {
            const res = await request(server).post("/api/users/forgot-password").send({ email: "test@test.com" });

            expect(res.status).toBe(404);
        });
    });

    describe("PUT /change-password", () => {
        it("should return a 200 status with the result of the user update", async () => {
            const token = users[1].generateAuthToken();

            const res = await request(server).put("/api/users/change-password").set("authorization", "Bearer " + token).send({ password: "1234567" });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("user");
        });

        it("should return a 401 status if authentication token is not sent with the request", async () => {
            const res = await request(server).put("/api/users/change-password").send();

            expect(res.status).toBe(401);
        });
    });
});