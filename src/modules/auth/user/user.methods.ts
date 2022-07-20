import { viewDocMetaTimeStamp } from '../../../utils';
import { User } from '../auth.types';
import { IUser, UserBase } from './user.types';

export type UserMethodsType = typeof UserMethods;

export const UserMethods = {
  baseView(this: IUser): UserBase {
    return {
      _id: this._id.toHexString(),

      name: this.name,

      email: this.email,
    };
  },

  async view(this: IUser): Promise<User> {
    return {
      ...this.baseView(),

      ...viewDocMetaTimeStamp(this),
    };
  },
};
