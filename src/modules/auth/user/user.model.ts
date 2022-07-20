import { config } from '../../../config';
import { WithPaginatePlugin } from '../../../utils';
import { AuthCollections, AuthDBConnection, AuthModels } from '../auth.config';
import { UserMethods } from './user.methods';
import { UserSchema } from './user.schema';
import { UserStatics } from './user.statics';
import { IUser, IUserModel } from './user.types';

UserSchema.methods = UserMethods;
UserSchema.statics = UserStatics;

UserSchema.plugin(WithPaginatePlugin, { basePath: config.APP_SERVING_URL });

export const UserModel: IUserModel = AuthDBConnection.model<IUser, IUserModel>(
  AuthModels.User,
  UserSchema,
  AuthCollections.User,
);
