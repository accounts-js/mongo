// @flow

import { get } from 'lodash';
import { DBDriver, UserObjectType } from '@accounts/accounts';

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

class Mongo extends DBDriver {
  options: MongoOptionsType;
  // TODO definition for mongodb connection object
  db: any;
  collection: any;

  constructor(db: any, options: MongoOptionsType) {
    super();
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

  async setupIndexes(): Promise<void> {
    await this.collection.createIndex('username', { unique: 1, sparse: 1 });
    await this.collection.createIndex('emails.address', { unique: 1, sparse: 1 });
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
      user.emails = [{ address: options.email.toLowerCase(), verified: false }];
    }
    return this.collection.insertOne(user).then(data => data.ops[0]);
  }

  findUserById(userId: string): Promise<?UserObjectType> {
    return this.collection.findOne({ _id: userId });
  }

  findUserByEmail(email: string): Promise<?UserObjectType> {
    return this.collection.findOne({ 'emails.address': email.toLowerCase() });
  }

  findUserByUsername(username: string): Promise<?UserObjectType> {
    return this.collection.findOne({ username });
  }

  async findPasswordHash(userId: string): Promise<?string> {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user.services.password.bcrypt;
  }

  async addEmail(userId: string, newEmail: string, verified: boolean): Promise<void> {
    const ret = await this.collection.update({ _id: userId }, {
      $addToSet: {
        emails: {
          address: newEmail.toLowerCase(),
          verified,
        },
      },
    });
    if (ret.result.nModified === 0) {
      throw new Error('User not found');
    }
  }

  async removeEmail(userId: string, email: string): Promise<void> {
    const ret = await this.collection.update({ _id: userId }, {
      $pull: { emails: { address: email.toLowerCase() } },
    });
    if (ret.result.nModified === 0) {
      throw new Error('User not found');
    }
  }

  async setUsername(userId: string, newUsername: string): Promise<void> {
    const ret = await this.collection.update({ _id: userId }, {
      $set: { username: newUsername },
    });
    if (ret.result.nModified === 0) {
      throw new Error('User not found');
    }
  }

  async setPasssword(userId: string, newPassword: string): Promise<void> {
    // TODO hash newPassword
    const ret = await this.collection.update({ _id: userId }, {
      $set: { 'services.password.bcrypt': newPassword },
    });
    if (ret.result.nModified === 0) {
      throw new Error('User not found');
    }
  }
}

export default Mongo;
