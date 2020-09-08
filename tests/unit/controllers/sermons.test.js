const httpMocks = require("node-mocks-http");
const util = require("util");

const sermonsController = require("../../../controllers/sermons");
const Sermon = require("../../../models/sermon");

let req, res, next;
let sermons;

describe("sermonsController", () => {
    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        next = jest.fn();
    
        Sermon.find = jest.fn();
        Sermon.findById = jest.fn();
        Sermon.create = jest.fn();
        Sermon.findByIdAndUpdate = jest.fn();
        Sermon.deleteOne = jest.fn();

        util.promisify = jest.fn();
    
        sermons = [
            {
                title: "Test Sermon 1",
                scripture: "Test Scripture 1",
                speaker: "Test Speaker 1",
                date: Date.now().toString(),
                mp3: "test-1.mp3"
            },
            {
                title: "Test Sermon 2",
                scripture: "Test Scripture 2",
                speaker: "Test Speaker 2",
                date: Date.now().toString(),
                mp3: "test-2.mp3"
            },
            {
                title: "Test Sermon 3",
                scripture: "Test Scripture 3",
                speaker: "Test Speaker 3",
                date: Date.now().toString(),
                mp3: "test-3.mp3"
            }
        ];
    });
    
    afterEach(() => {
        sermons = [];
    });
    
    describe("getSermons", () => {
        it("should return all sermons", async () => {
            Sermon.find.mockReturnValue({
                sort: function() {
                    return sermons;
                }
            });
    
            await sermonsController.getSermons(req, res, next);
    
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toHaveProperty("sermons");
            expect(res._getJSONData()).toMatchObject({ "sermons": sermons });
        });
    
        it("should return a 500 error if there's a problem with the query", async () => {
            Sermon.find.mockRejectedValue(new Error("Test"));
    
            await sermonsController.getSermons(req, res, next);
    
            expect(res.statusCode).toBe(500);
            expect(res._getJSONData()).toHaveProperty("error");
        });
    });

    describe("getLimitedSermons", () => {
        it("should include a limit in the query", async () => {
            req.params.number = 1;
            Sermon.find.mockReturnValue(sermons);

            await sermonsController.getLimitedSermons(req, res, next);

            expect(res.statusCode).toBe(200);
            expect(Sermon.find.mock.calls[0][2]).toHaveProperty("limit", 1);
        });

        it("should default to a limit of 3 if the given parameter is invalid", async () => {
            req.params.number = "test";
            Sermon.find.mockReturnValue(sermons);

            await sermonsController.getLimitedSermons(req, res, next);

            expect(res.statusCode).toBe(200);
            expect(Sermon.find.mock.calls[0][2]).toHaveProperty("limit", 3);
        });

        it("should return sermons", async () => {
            Sermon.find.mockReturnValue(sermons);

            await sermonsController.getLimitedSermons(req, res, next);

            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toHaveProperty("sermons");
            expect(res._getJSONData().sermons.length).toBe(sermons.length);
        });

        it("should return a 500 error if there's a problem with the query", async () => {
            Sermon.find.mockRejectedValue(new Error("Test"));

            await sermonsController.getLimitedSermons(req, res, next);

            expect(res.statusCode).toBe(500);
            expect(res._getJSONData()).toHaveProperty("error");
        });
    });

    describe("getSermon", () => {
        it("should return a single sermon if a valid ID is given", async () => {
            Sermon.findById.mockReturnValue(sermons[0]);

            await sermonsController.getSermon(req, res, next);

            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toHaveProperty("sermon");
            expect(res._getJSONData().sermon).toMatchObject(sermons[0]);
        });

        it("should return a 404 status if a sermon could not be found for the given ID", async () => {
            Sermon.findById.mockReturnValue(null);

            await sermonsController.getSermon(req, res, next);

            expect(res.statusCode).toBe(404);
            expect(res._getJSONData()).toHaveProperty("error");
        });

        it("should return a 500 error if there's a problem with the query", async () => {
            Sermon.findById.mockRejectedValue(new Error("Test"));

            await sermonsController.getSermon(req, res, next);

            expect(res.statusCode).toBe(500);
            expect(res._getJSONData()).toHaveProperty("error");
        });
    });

    describe("createSermon", () => {
        beforeEach(() => {
            req.file = {
                filename: "test.mp3"
            };
        });

        it("should create a sermon and return it with a 201 status", async () => {
            Sermon.create.mockReturnValue(sermons[0]);
            Sermon.find.mockReturnValue(null);

            await sermonsController.createSermon(req, res, next);

            expect(res.statusCode).toBe(201);
            expect(res._getJSONData()).toHaveProperty("sermon");
            expect(res._getJSONData().sermon).toHaveProperty("name", sermons[0].name);
        });

        it("should return a 400 error if the limit of 10 sermons has already been reached", async () => {
            Sermon.create.mockReturnValue(sermons[0]);
            Sermon.find.mockReturnValue(new Array(10));

            await sermonsController.createSermon(req, res, next);

            expect(res.statusCode).toBe(400);
            expect(res._getJSONData()).toHaveProperty("error");
        });

        it("should return a 500 error if there's a problem with the query", async () => {
            Sermon.find.mockRejectedValue(new Error("Test"));

            await sermonsController.createSermon(req, res, next);

            expect(res.statusCode).toBe(500);
            expect(res._getJSONData()).toHaveProperty("error");
        });
    });

    describe("updateSermon", () => {
        it("should update the sermon with the given ID", async () => {
            req.params.id = 1;
            Sermon.findByIdAndUpdate.mockReturnValue(sermons[0]);

            await sermonsController.updateSermon(req, res, next);

            expect(res.statusCode).toBe(200);
            expect(Sermon.findByIdAndUpdate.mock.calls[0][0]).toBe(1);
            expect(res._getJSONData()).toHaveProperty("sermon");
            expect(res._getJSONData().sermon).toHaveProperty("name", sermons[0].name);
        });

        it("should return a 404 status if a match could not be found for the given ID", async () => {
            Sermon.findByIdAndUpdate.mockReturnValue(null);

            await sermonsController.updateSermon(req, res, next);

            expect(res.statusCode).toBe(404);
            expect(res._getJSONData()).toHaveProperty("error");
        });

        it("should return a 500 error if there's a problem with the query", async () => {
            Sermon.findByIdAndUpdate.mockRejectedValue(new Error("Test"));

            await sermonsController.updateSermon(req, res, next);

            expect(res.statusCode).toBe(500);
            expect(res._getJSONData()).toHaveProperty("error");
        });
    });

    describe("deleteSermon", () => {
        it("should return a 200 status with the result of delete query", async () => {
            Sermon.findById.mockReturnValue(sermons[0]);
            Sermon.deleteOne.mockReturnValue(sermons[0]);
            util.promisify.mockReturnValue(function () {
                return null; 
            });

            await sermonsController.deleteSermon(req, res, next);

            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toHaveProperty("sermon");
            expect(res._getJSONData().sermon).toHaveProperty("name", sermons[0].name);
        });

        it("should return a 404 status if the given ID doesn't have a match", async () => {
            Sermon.findById.mockReturnValue(null);

            await sermonsController.deleteSermon(req, res, next);

            expect(res.statusCode).toBe(404);
            expect(res._getJSONData()).toHaveProperty("error");
        });

        it("should return a 500 error if there's a problem with the query", async () => {
            Sermon.findById.mockReturnValue(sermons[0]);
            Sermon.deleteOne.mockRejectedValue(new Error("Test"));
            util.promisify.mockReturnValue(function () {
                return null;
            });

            await sermonsController.deleteSermon(req, res, next);

            expect(res.statusCode).toBe(500);
            expect(res._getJSONData()).toHaveProperty("error");
        });
    });
});
