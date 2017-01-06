// @flow

import { get } from 'lodash';

export type MongoOptionsType = {
  collectionName: string,
  timestamps: {
    createdAt: string,
    updatedAt: string,
  }
};

export type MongoUserObjectType = {
  username?: string,
  profile?: Object,
  services: {
    password?: {
      bcrypt: string,
    },
  },
  emails?: [{
    address: string,
    verified: boolean,
  }],
};

// TODO Will import from @accounts/account once it's published on npm
export type UserObjectType = {
  username: ?string,
  email: ?string,
  id: ?string,
  profile: ?Object,
  password: ?string,
};

class Mongo {
  options: MongoOptionsType;
  // TODO definition for mongodb connection object
  db: any;
  collection: any;

  constructor(db: any, options: MongoOptionsType) {
    const defaultOptions = {
      collectionName: 'users',
      timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      },
    };
    this.options = { ...defaultOptions, ...options };
    if (get(db, 'constructor.define.name') !== 'Db') {
      throw new Error('A valid database connection object is required');
    }
    this.db = db;
    this.collection = this.db.collection(this.options.collectionName);
  }

  async setupIndexes(): Promise<boolean> {
    await this.collection.createIndex('username', { unique: 1, sparse: 1 });
    await this.collection.createIndex('emails.address', { unique: 1, sparse: 1 });
    return true;
  }

  createUser(options: UserObjectType): Promise<UserObjectType> {
    const user: MongoUserObjectType = {
      services: {},
      [this.options.timestamps.createdAt]: Date.now(),
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
    return this.collection.insertOne(user).then(data => data.ops[0]);
  }

  findUserById(id: string): Promise<UserObjectType> {
    return this.collection.findOne({ _id: id });
  }

  findUserByEmail(email: string): Promise<UserObjectType> {
    return this.collection.findOne({ 'emails.address': email });
  }

  findUserByUsername(username: string): Promise<UserObjectType> {
    return this.collection.findOne({ username });
  }

  async addEmail(userId: string, newEmail: string, verified: boolean): Promise<boolean> {
    const user = await this.collection.findOne({ _id: userId });
    if (!user) {
      throw new Error('User not found');
    }
    await this.collection.update({ _id: user._id }, {
      $addToSet: {
        emails: {
          address: newEmail,
          verified,
        },
      },
    });
    return true;
  }

  async removeEmail(userId: string, email: string): Promise<boolean> {
    const user = await this.collection.findOne({ _id: userId });
    if (!user) {
      throw new Error('User not found');
    }
    await this.collection.update({ _id: user._id }, {
      $pull: { emails: { address: email } },
    });
    return true;
  }

  async setUsername(userId: string, newUsername: string): Promise<boolean> {
    const user = await this.collection.findOne({ _id: userId });
    if (!user) {
      throw new Error('User not found');
    }
    await this.collection.update({ _id: user._id }, {
      $set: { username: newUsername },
    });
    return true;
  }
}

export default Mongo;
