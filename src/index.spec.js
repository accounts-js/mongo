import mongodb from 'mongodb';
import Mongo from './index';

let db;
const user = {
  username: 'johndoe',
  email: 'john@doe.com',
  password: 'toto',
  profile: {},
};

function createConnection(cb) {
  const url = 'mongodb://localhost:27017/accounts-mongo-tests';
  mongodb.MongoClient.connect(url, (err, dbArg) => {
    db = dbArg;
    cb(err);
  });
}

function closeConnection(cb) {
  db.dropDatabase((err) => {
    if (err) cb(err);
    db.close();
    cb();
  });
}

describe('Mongo', () => {
  beforeAll(createConnection);

  describe('#constructor', () => {
    it('should have default options', () => {
      const mongo = new Mongo(db);
      expect(mongo.options).toBeTruthy();
    });

    it('should overwrite options', () => {
      const mongo = new Mongo(db, {
        collectionName: 'users-test',
      });
      expect(mongo.options).toBeTruthy();
      expect(mongo.options.collectionName).toEqual('users-test');
    });

    it('should throw with an invalid database connection object', () => {
      try {
        new Mongo(); // eslint-disable-line no-new
        throw new Error();
      } catch (err) {
        expect(err.message).toBe('A valid database connetion object is required');
      }
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const mongo = new Mongo(db);
      const ret = await mongo.createUser(user);
      expect(ret._id).toBeTruthy(); // eslint-disable-line no-underscore-dangle
      expect(ret.emails[0].address).toBe(user.email);
      expect(ret.emails[0].verified).toBe(false);
      expect(ret.createdAt).toBeTruthy();
    });
  });

  describe('findUserByEmail', () => {
    it('should return null for not found user', async () => {
      const mongo = new Mongo(db);
      const ret = await mongo.findUserByEmail('unknow@user.com');
      expect(ret).not.toBeTruthy();
    });

    it('should return user', async () => {
      const mongo = new Mongo(db);
      const ret = await mongo.findUserByEmail(user.email);
      expect(ret).toBeTruthy();
    });
  });

  describe('findUserByUsername', () => {
    it('should return null for not found user', async () => {
      const mongo = new Mongo(db);
      const ret = await mongo.findUserByUsername('unknowuser');
      expect(ret).not.toBeTruthy();
    });

    it('should return user', async () => {
      const mongo = new Mongo(db);
      const ret = await mongo.findUserByUsername(user.username);
      expect(ret).toBeTruthy();
    });
  });

  afterAll(closeConnection);
});
