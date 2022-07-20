import dbConnection from '../../config/mongoose';
import { modelNameToCollectionName } from '../../utils';

export enum AuthModels {
  User = 'User',
  Password = 'AuthPassword',
  Session = 'AuthSession',
}

export const AuthCollections = {
  User: modelNameToCollectionName(AuthModels.User, 's'),
  Password: modelNameToCollectionName(AuthModels.Password, 's'),
  Session: modelNameToCollectionName(AuthModels.Session, 's'),
};

export const AuthDBConnection = dbConnection;
