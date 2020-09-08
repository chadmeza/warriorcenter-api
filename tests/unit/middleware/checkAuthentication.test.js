const httpMocks = require('node-mocks-http');
const jwt = require('jsonwebtoken');

const checkAuthentication = require('../../../middleware/checkAuthentication');

let req, res, next;

describe('checkAuthentication', () => {
    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        next = jest.fn();
    });

    it('should continue down the stack if the request has an authorization header', () => {
        jwt.verify = jest.fn().mockReturnValue({ email: 'test@test.com', userId: '1234' });
        req = httpMocks.createRequest({ headers: { authorization: "Bearer testToken" } });

        checkAuthentication(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('should return a 401 status code if the request does not have an authorization header', () => {
        checkAuthentication(req, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(401);
    });
});