import _ from 'lodash';

// TODO setup all mongodb indexes

class Mongo {
  constructor(db, options) {
    const defaultOptions = {
      collectionName: 'users',
      timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      },
    };
    this.options = Object.assign({}, defaultOptions, options);
    if (_.get(db, 'constructor.define.name') !== 'Db') {
      throw new Error('A valid database connetion object is required');
    }
    this.db = db;
    this.collection = this.db.collection(this.options.collectionName);
  }

  createUser(options) {
    const user = {
      services: {},
      [this.options.timestamps.createdAt]: new Date(),
    };
    // TODO hash password
    if (options.password) {
      user.services.password = { bcrypt: options.password };
    }
    if (options.username) {
      user.username = options.username;
    }
    if (options.email) {
      user.emails = [{ address: options.email, verified: false }];
    }
    return this.collection.insert(user).then((data) => {
      if (data.ops) {
        return data.ops[0];
      }
      return data;
    });
  }

  findUserByEmail(email) {
    return this.collection.findOne({ 'emails.address': email });
  }

  findUserByUsername(username) {
    return this.collection.findOne({ username });
  }
}

export default Mongo;
