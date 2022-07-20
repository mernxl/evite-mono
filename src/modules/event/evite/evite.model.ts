import { addDocMetaUserActionToSchema } from '../../../utils';
import { EventCollections, EventDBConnection, EventModels } from '../event.config';
import { EviteMethods } from './evite.methods';
import { EviteSchema } from './evite.schema';
import { EviteStatics } from './evite.statics';
import { IEvite, IEviteModel } from './evite.types';

EviteSchema.methods = EviteMethods;
EviteSchema.statics = EviteStatics;

addDocMetaUserActionToSchema(EviteSchema);

export const EviteModel = EventDBConnection.model<IEvite, IEviteModel>(
  EventModels.Evite,
  EviteSchema,
  EventCollections.Evite,
);
