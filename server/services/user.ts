import bcrypt from 'bcrypt'
import { model, Schema, Model, Document } from 'mongoose'
import { UserModel, User, IUser } from '../models/user'
import * as password_service from './password'
import { signJwt } from '../utils/auth/jwt'
const config = require('../config');

export interface CreateUserCredentials {
  name: string,
  dateOfBirth: Date,
  email: string,
  password: string
}

export interface LoginCredentials {
  email: string,
  password: string,
}

export const createUser = async (input : CreateUserCredentials) => {
  
  const existingUser = await UserModel.findOne({email: input.email});

  if (existingUser) {
    // TODO send appropriate error
    return null;
  }

  const hashVal = await password_service.hashPassword(input.password);
  
  const userDoc = new UserModel({
    name: input.name,
    dateOfBirth: input.dateOfBirth,
    email: input.email,
    password: hashVal
  });

  await userDoc.save();

  return new User(userDoc);
};

export const findUser = async (email : string) => {

  const userDoc = await UserModel.findOne({ email : email });

  if (!userDoc) {
    return null;
  }

  return new User(userDoc);
}

// Sign Tokens for this User
export const signToken = async (user: User) => {

  // Sign the Access Token
  const accessToken = signJwt(
    'accessTokenSecretKey',
    { sub: user.email },
    {
      expiresIn: `${config.jwt.accessTokenExpiresIn}m`
    }
  );

  // Sign the Refresh Token
  const refreshToken = signJwt(
    'refreshTokenSecretKey',
    { sub: user.email },
    {
      expiresIn: `${config.jwt.refreshTokenExpiresIn}m`
    }
  );
  
  // Return signed tokens
  return { accessToken, refreshToken }
};

