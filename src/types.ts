import splitSmartly, { EnumIncludeSeparatorMode, SearchResults } from './index';

export type IBracketsItem = [open: IBracketsObject["open"], close: IBracketsObject["close"], searchLevels?: IBracketsObject["searchLevels"], ignoreMode?: IBracketsObject["ignoreMode"]];

export type IBrackets = IBracketsItem[];

export type IBracketsInput = true | string | IBrackets | Record<string, string>;

export interface IBracketsObject
{
	open: string;
	close: string;
	searchLevels: boolean | number[]
	ignoreMode: boolean;
}

export interface IBracketsMap
{
	[k: string]: IBracketsObject
}

export type IMentionsInput = string | boolean | string[] | Record<string, string>;

export interface ISplitSettings<M extends IIncludeSeparatorMode>
{
	brackets: IBracketsInput;
	mentions: IMentionsInput;
	ignoreInsideQuotes: boolean;
	includeSeparatorMode: M;
	ignoreCase: boolean;
	trimResult: boolean;
	trimSeparators: boolean;

	check(checkParams: ICheckParams): boolean;

	defaultBrackets: IBrackets;
	separators: ISeparators;

	init(): ISplitSettings<M>;

	merge<M2 extends IIncludeSeparatorMode = M>(settings: ISplitSettingsInput<M2>): ISplitSettings<M2>;

	arrayToPattern(arr: string[]): string;

	createRegExp(pattern: string): RegExp;

	createBracketsMap(): ISplitSettings<M>;

	createBracketsSearch(): ISplitSettings<M>;

	createSeparatorsSearch(): ISplitSettings<M>;

	bracketsMap: IBracketsMap;
	bracketsSearch: RegExp;
	separatorSearch: RegExp;
	searchWithin: boolean
	indexes: number | any[]
	returnIterator: boolean

	includePositions,
}

export interface ISplitSettingsInput<M extends IIncludeSeparatorMode> extends Partial<ISplitSettings<M>>
{

}

export interface ISearchSettings<M extends IIncludeSeparatorMode = EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_SEPARATELY> extends ISplitSettings<M>
{
	includeSeparatorMode: M;
}

export interface ISearchSettingsInput<M extends IIncludeSeparatorMode = EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_SEPARATELY> extends Partial<ISearchSettings<M>>
{

}

export interface ICheckParams
{
	getString(...args): string;

	getTextAfter(...args): string;

	getMentions(...args): any;

	getSeparator(...args): string;

	readonly string: string;

	readonly textAfter: string;

	readonly mentions: any;

	readonly separator: string;
}

export interface IMention
{
	index: number
	mention
}

export type IPipeItem = string | [string, ISeparators] | [ISeparators, string] | ISeparators

export interface IPipeItem2
{
	[EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_SEPARATELY]: string
	[EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_LEFT]: [string, ISeparators]
	[EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_RIGHT]: [ISeparators, string]
	[EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_ONLY]: ISeparators
}

export type IGetPipeItemByIncludeSeparatorMode<M extends IIncludeSeparatorMode> =
	M extends EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_ONLY ?
		IPipeItem2[EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_ONLY] :
		M extends EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_RIGHT ?
			IPipeItem2[EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_RIGHT] :
			M extends EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_LEFT ?
				IPipeItem2[EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_LEFT] :
				IPipeItem2[EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_SEPARATELY]
	;
export type IGetIncludeSeparatorModeBySettings<T extends ISearchSettingsInput<IIncludeSeparatorMode>> = T extends ISearchSettingsInput<infer M>
	? M
	: IIncludeSeparatorMode
export type IGetPipeItemBySettings<T extends ISearchSettingsInput<IIncludeSeparatorMode>> = IGetPipeItemByIncludeSeparatorMode<IGetIncludeSeparatorModeBySettings<T>>
export type IIncludeSeparatorMode =
	EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_NONE
	| EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_SEPARATELY
	| EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_LEFT
	| EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_RIGHT
	| EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_ONLY
export type ISeparators = string | string[] | RegExp;
export type ISeparatorsNode = ISeparators | ITextDataSeparator;

export interface ITextNodeBase
{
	text: string
	position?: number
	isSeparator?: void
	mentions?: IMention[]
}

export interface ITextDataSeparator extends Omit<ITextNodeBase, 'isSeparator' | 'text'>
{
	text: ISeparators
	position: number
	isSeparator: true
}

export type ITextNodeOrText = string | ITextNodeBase | ITextDataSeparator;

export const enum EnumFindBracketsAction
{
	ACTION_CLOSE = 1,
	ACTION_OPEN,
	ACTION_ADD_FRAGMENT,
	ACTION_NULL,
}

export type IParametersSplitSmartlyReturnQuery<M extends IIncludeSeparatorMode> = [Exclude<ISeparators, string>, ISplitSettingsInput<M>?];

export type IParametersSplitSmartlyReturnResult<M extends IIncludeSeparatorMode> = [...([string, ISeparators?] | [string]), ISplitSettingsInput<M>?];

export type IParametersSplitSmartly<M extends IIncludeSeparatorMode> = IParametersSplitSmartlyReturnQuery<M> | IParametersSplitSmartlyReturnResult<M>;

export interface ISplitFunctionCore<M extends IIncludeSeparatorMode>
{
	(string: string, settings?: ISearchSettingsInput<M>): SearchResults<M> | IGetPipeItemByIncludeSeparatorMode<M> | IGetPipeItemByIncludeSeparatorMode<M>[]
}

export interface ISplitFunction<M extends IIncludeSeparatorMode> extends ISplitFunctionCore<M>, ThisType<ISplitSettings<M>>
{
	getOne<T extends ISearchSettingsInput<IIncludeSeparatorMode> = ISearchSettingsInput<M>>(string: string, index: number, settings?: T): IGetPipeItemBySettings<T>;
	getFirst<T extends ISearchSettingsInput<IIncludeSeparatorMode> = ISearchSettingsInput<M>>(string: string, settings?: T): IGetPipeItemBySettings<T>;
	getIndexes<T extends ISearchSettingsInput<IIncludeSeparatorMode> = ISearchSettingsInput<M>>(string: string, indexes: any[], settings?: T): IGetPipeItemBySettings<T>;
	getIterator<T extends ISearchSettingsInput<IIncludeSeparatorMode> = ISearchSettingsInput<M>>(string: string, settings?: T): SearchResults<IGetIncludeSeparatorModeBySettings<T>>;
}
