import { EventCollections, EventDBConnection, EventModels } from '../event.config';
import { EventMethods } from './event.methods';
import { EventSchema } from './event.schema';
import { EventStatics } from './event.statics';
import { IEvent, IEventModel } from './event.types';

EventSchema.methods = EventMethods;
EventSchema.statics = EventStatics;

export const EventModel = EventDBConnection.model<IEvent, IEventModel>(
  EventModels.Event,
  EventSchema,
  EventCollections.Event,
);
