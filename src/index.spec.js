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
        expect(err.message).toBe('A valid database connection object is required');
      }
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const mongo = new Mongo(db);
      const ret = await mongo.createUser(user);
      expect(ret._id).toBeTruthy();
      expect(ret.emails[0].address).toBe(user.email);
      expect(ret.emails[0].verified).toBe(false);
      expect(ret.createdAt).toBeTruthy();
    });

    it('should not set password', async () => {
      const mongo = new Mongo(db);
      const ret = await mongo.createUser({ email: user.email });
      expect(ret._id).toBeTruthy();
      expect(ret.services.password).not.toBeTruthy();
    });

    it('should not set username', async () => {
      const mongo = new Mongo(db);
      const ret = await mongo.createUser({ email: user.email });
      expect(ret._id).toBeTruthy();
      expect(ret.username).not.toBeTruthy();
    });

    it('should not set email', async () => {
      const mongo = new Mongo(db);
      const ret = await mongo.createUser({ username: user.username });
      expect(ret._id).toBeTruthy();
      expect(ret.emails).not.toBeTruthy();
    });
  });

  describe('findUserById', () => {
    it('should return null for not found user', async () => {
      const mongo = new Mongo(db);
      const ret = await mongo.findUserById('unknowuser');
      expect(ret).not.toBeTruthy();
    });

    it('should return user', async () => {
      const mongo = new Mongo(db);
      const retUser = await mongo.createUser(user);
      const ret = await mongo.findUserById(retUser._id);
      expect(ret).toBeTruthy();
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

  describe('addEmail', () => {
    it('should throw if user is not found', async () => {
      const mongo = new Mongo(db);
      try {
        await mongo.addEmail('unknowuser');
        throw new Error();
      } catch (err) {
        expect(err.message).toEqual('User not found');
      }
    });

    it('should add email', async () => {
      const email = 'johns@doe.com';
      const mongo = new Mongo(db);
      let retUser = await mongo.createUser(user);
      const ret = await mongo.addEmail(retUser._id, email, false);
      retUser = await mongo.findUserByEmail(email);
      expect(ret).toBeTruthy();
      expect(retUser.emails.length).toEqual(2);
    });
  });

  describe('removeEmail', () => {
    it('should throw if user is not found', async () => {
      const mongo = new Mongo(db);
      try {
        await mongo.removeEmail('unknowuser');
        throw new Error();
      } catch (err) {
        expect(err.message).toEqual('User not found');
      }
    });

    it('should remove email', async () => {
      const email = 'johns@doe.com';
      const mongo = new Mongo(db);
      let retUser = await mongo.createUser(user);
      await mongo.addEmail(retUser._id, email, false);
      const ret = await mongo.removeEmail(retUser._id, user.email, false);
      retUser = await mongo.findUserById(retUser._id);
      expect(ret).toBeTruthy();
      expect(retUser.emails.length).toEqual(1);
      expect(retUser.emails[0].address).toEqual(email);
    });
  });

  describe('setUsername', () => {
    it('should throw if user is not found', async () => {
      const mongo = new Mongo(db);
      try {
        await mongo.setUsername('unknowuser');
        throw new Error();
      } catch (err) {
        expect(err.message).toEqual('User not found');
      }
    });

    it('should change username', async () => {
      const username = 'johnsdoe';
      const mongo = new Mongo(db);
      let retUser = await mongo.createUser(user);
      const ret = await mongo.setUsername(retUser._id, username);
      retUser = await mongo.findUserById(retUser._id);
      expect(ret).toBeTruthy();
      expect(retUser.username).toEqual(username);
    });
  });

  afterAll(closeConnection);
});
