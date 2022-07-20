import { ClientSession, Connection, Document, DocumentDefinition } from 'mongoose';

import { IDocMetaUserTimestamp, UpdatableDocMeta } from './docMeta.utils';
import { escapeRegExp } from './validations';

export type CompoundIndex<T extends Document> = { [key in keyof Omit<T, keyof Document>]?: number };

/**
 * Converts a sort string to an object
 * Format
 *  -field.nest field => { "field.nest" : -1, field: 1 }
 */
export const sortStringToObject = (sort: string): Record<string, number> => {
  const sortObj: Record<string, number> = {};
  for (const string of sort.split(/\s+/)) {
    if (string[0] === '-') {
      sortObj[string.substr(1)] = -1;
    } else {
      sortObj[string] = 1;
    }
  }
  return sortObj;
};

/**
 * Search a term by regex
 */
export const getSearchByTermRegex = (term: string): RegExp => new RegExp(escapeRegExp(term), 'i');
export const getMatchBySearchTermRegex = <DocType extends Record<string, any> = any>(
  fields: (keyof DocType)[],
  term: string,
): { $or: Record<keyof DocType, RegExp>[] } => {
  const _term = escapeRegExp(term);

  return {
    $or: fields.map(
      (field) => ({ [field]: new RegExp(_term, 'i') } as Record<keyof DocType, RegExp>),
    ),
  };
};

/**
 * Function used to wrap session aware methods, and returns the value returned within that function.
 * This function assumes all models belong to about same db, or you pass a db where it will create a
 * fresh session.
 *
 * @param config
 * @param method
 */
export const sessionAwareMethod = async <T>(
  config: { db: Connection; session?: ClientSession },
  method: (session: ClientSession) => Promise<T>,
): Promise<T> => {
  const session = config.session || (await config.db.startSession());

  let returnValue: T;

  if (session.inTransaction()) {
    returnValue = await method(session);
  } else {
    await session.withTransaction(async () => {
      returnValue = await method(session);
    });

    session.endSession();
  }

  return returnValue!;
};

/**
 * Get a lowercase snake_case collection name from a CamelCase modelName
 * @param modelName - Module name to create collection name from
 * @param postfix - postfix to affix on the the collection name before returning, like s
 */
export const modelNameToCollectionName = (modelName: string, postfix = ''): string => {
  let collectionName = '';

  for (let i = 0; i < modelName.length; i++) {
    if (modelName[i].match(/[A-Z]/)) {
      if (i > 0) {
        collectionName += `_${modelName[i].toLowerCase()}`;
      } else {
        // if first, no underscore
        collectionName += `${modelName[i].toLowerCase()}`;
      }
    } else {
      collectionName += modelName[i];
    }
  }

  return collectionName + postfix;
};

/**
 * For populating extra fields on mongoose documents
 *
 * @param doc - Document to populate from
 * @param fieldIdName - field to populate
 */
export const populateField = async <DocType extends Document, ReturnType extends Document>(
  doc: DocType,
  fieldIdName: string & keyof DocType,
): Promise<ReturnType | null> => {
  // to avoid `MongoError: Use of expired sessions is not permitted`,
  // we need to set the session to null
  doc.$session(null as any);

  const old = doc[fieldIdName];

  const populated = await doc.populate(fieldIdName);

  if (old === populated[fieldIdName]) {
    return null;
  }

  doc[fieldIdName] = old;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore baseView()
  return Promise.resolve(populated[fieldIdName]);
};

/**
 * Field must be defined, either it can be undefined not optional
 */
export type ModifiableFields<Type> = {
  [index in keyof Type]: Type[index] | undefined;
};

/**
 * Since tsoa does no support direct undefined as type, we are forces to pass
 * data received from tsoa to make its type as the new, so it is statically validated.
 */
export const isModifiableData = <Type>(data: Type): ModifiableFields<Required<Type>> => data as any;

/**
 * A typed function to show errors when updating documents with missed fields
 *
 * Picks up missing fields especially in mapping case
 * Finally performs an update of the document by calling set method
 *
 * NOTE: All undefined fields will be removed, so if you really need to pass undefined to a field,
 * do it manually or pass an alternative like '' for string, false for boolean, 0 for numbers
 */
export const updateDoc = <DocType extends Document, DocBaseType extends Record<string, any>>(
  doc: DocType,
  update: ModifiableFields<
    Omit<DocumentDefinition<DocBaseType>, keyof Omit<IDocMetaUserTimestamp, keyof UpdatableDocMeta>>
  >,
): void => {
  // clean up all undefined. If you need to set to undefined, do so manually
  const cloneUpdate: Record<string, any> = {};

  for (const updateKey in update) {
    if (typeof (update as any)[updateKey] !== 'undefined') {
      cloneUpdate[updateKey] = (update as any)[updateKey];
    }
  }

  doc.set(cloneUpdate);
};
