export declare type IBracketsItem = [
	open: IBracketsObject["open"],
	close: IBracketsObject["close"],
	searchLevels?: IBracketsObject["searchLevels"],
	ignoreMode?: IBracketsObject["ignoreMode"]
];
export declare type IBrackets = IBracketsItem[];
export declare type IBracketsInput = true | string | IBrackets | Record<string, string>;
export interface IBracketsObject {
	open: string;
	close: string;
	searchLevels: boolean | number[];
	ignoreMode: boolean;
}
export interface IBracketsMap {
	[k: string]: IBracketsObject;
}
export declare type IMentionsInput = string | boolean | string[] | Record<string, string>;
export interface ISplitSettings<M extends IIncludeSeparatorMode> {
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
	searchWithin: boolean;
	indexes: number | any[];
	returnIterator: boolean;
	includePositions: any;
}
export interface ISplitSettingsInput<M extends IIncludeSeparatorMode> extends Partial<ISplitSettings<M>> {
}
export interface ISearchSettings<M extends IIncludeSeparatorMode = EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_SEPARATELY> extends ISplitSettings<M> {
	includeSeparatorMode: M;
}
export interface ISearchSettingsInput<M extends IIncludeSeparatorMode = EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_SEPARATELY> extends Partial<ISearchSettings<M>> {
}
export interface ICheckParams {
	getString(...args: any[]): string;
	getTextAfter(...args: any[]): string;
	getMentions(...args: any[]): any;
	getSeparator(...args: any[]): string;
	readonly string: string;
	readonly textAfter: string;
	readonly mentions: any;
	readonly separator: string;
}
export interface IMention {
	index: number;
	mention: any;
}
export interface IPipeItem2 {
	[EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_SEPARATELY]: string;
	[EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_LEFT]: [
		string,
		ISeparators
	];
	[EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_RIGHT]: [
		ISeparators,
		string
	];
	[EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_ONLY]: ISeparators;
}
export declare type IGetPipeItemByIncludeSeparatorMode<M extends IIncludeSeparatorMode> = M extends EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_ONLY ? IPipeItem2[EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_ONLY] : M extends EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_RIGHT ? IPipeItem2[EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_RIGHT] : M extends EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_LEFT ? IPipeItem2[EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_LEFT] : IPipeItem2[EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_SEPARATELY];
export declare type IGetIncludeSeparatorModeBySettings<T extends ISearchSettingsInput<IIncludeSeparatorMode>> = T extends ISearchSettingsInput<infer M> ? M : IIncludeSeparatorMode;
export declare type IGetPipeItemBySettings<T extends ISearchSettingsInput<IIncludeSeparatorMode>> = IGetPipeItemByIncludeSeparatorMode<IGetIncludeSeparatorModeBySettings<T>>;
export declare type IIncludeSeparatorMode = EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_NONE | EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_SEPARATELY | EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_LEFT | EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_RIGHT | EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_ONLY;
export declare type ISeparators = string | string[] | RegExp;
export declare type ISeparatorsNode = ISeparators | ITextDataSeparator;
export interface ITextNodeBase {
	text: string;
	position?: number;
	isSeparator?: void;
	mentions?: IMention[];
}
export interface ITextDataSeparator extends Omit<ITextNodeBase, "isSeparator" | "text"> {
	text: ISeparators;
	position: number;
	isSeparator: true;
}
export declare type IParametersSplitSmartlyReturnQuery<M extends IIncludeSeparatorMode> = [
	Exclude<ISeparators, string>,
	ISplitSettingsInput<M>?
];
export declare type IParametersSplitSmartlyReturnResult<M extends IIncludeSeparatorMode> = [
	...([
		string,
		ISeparators?
	] | [
		string
	]),
	ISplitSettingsInput<M>?
];
export declare type IParametersSplitSmartly<M extends IIncludeSeparatorMode> = IParametersSplitSmartlyReturnQuery<M> | IParametersSplitSmartlyReturnResult<M>;
export interface ISplitFunctionCore<M extends IIncludeSeparatorMode> {
	(string: string, settings?: ISearchSettingsInput<M>): SearchResults<M> | IGetPipeItemByIncludeSeparatorMode<M> | IGetPipeItemByIncludeSeparatorMode<M>[];
}
export interface ISplitFunction<M extends IIncludeSeparatorMode> extends ISplitFunctionCore<M>, ThisType<ISplitSettings<M>> {
	getOne<T extends ISearchSettingsInput<IIncludeSeparatorMode> = ISearchSettingsInput<M>>(string: string, index: number, settings?: T): IGetPipeItemBySettings<T>;
	getFirst<T extends ISearchSettingsInput<IIncludeSeparatorMode> = ISearchSettingsInput<M>>(string: string, settings?: T): IGetPipeItemBySettings<T>;
	getIndexes<T extends ISearchSettingsInput<IIncludeSeparatorMode> = ISearchSettingsInput<M>>(string: string, indexes: any[], settings?: T): IGetPipeItemBySettings<T>;
	getIterator<T extends ISearchSettingsInput<IIncludeSeparatorMode> = ISearchSettingsInput<M>>(string: string, settings?: T): SearchResults<IGetIncludeSeparatorModeBySettings<T>>;
}
export declare function splitSmartly<M extends IIncludeSeparatorMode>(...args: IParametersSplitSmartlyReturnQuery<M>): ISplitFunction<M>;
export declare namespace splitSmartly {
	var searchWithin: <M extends IIncludeSeparatorMode>(...args: IParametersSplitSmartly<M> | [
		string,
		IBracketsInput
	]) => string[];
	var search: (...args: IParametersSplitSmartly<EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_ONLY>) => ISeparators | ISeparators[];
}
export declare function splitSmartly<M extends IIncludeSeparatorMode>(...args: IParametersSplitSmartlyReturnResult<M>): IGetPipeItemByIncludeSeparatorMode<M> | IGetPipeItemByIncludeSeparatorMode<M>[];
export declare namespace splitSmartly {
	var searchWithin: <M extends IIncludeSeparatorMode>(...args: IParametersSplitSmartly<M> | [
		string,
		IBracketsInput
	]) => string[];
	var search: (...args: IParametersSplitSmartly<EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_ONLY>) => ISeparators | ISeparators[];
}
export declare const createSplitFunction: <M extends IIncludeSeparatorMode>(settings: ISearchSettingsInput<M>) => ISplitFunction<M>;
export declare class SearchResults<M extends IIncludeSeparatorMode, T extends IGetPipeItemByIncludeSeparatorMode<IIncludeSeparatorMode> = IGetPipeItemBySettings<ISearchSettingsInput<M>>> {
	string: string;
	searchSettings: ISearchSettings<M>;
	brackets: any[];
	pipe: T[];
	currentMentions: IMention[];
	position: number;
	isDone: boolean;
	freeArea: {
		start: number;
		end: number;
	};
	lastSeparator: ISeparatorsNode;
	searchString: string;
	indexes: {
		values: Set<any[]>;
		max: number;
		count: number;
		hasIndex(): boolean;
		isOverMax(): boolean;
	};
	protected tempPosition: number;
	constructor(string: string, searchSettings: ISearchSettings<M>);
	prepareSearch(): void;
	get pipeIsEmpty(): boolean;
	getMentions(indexFrom: any, indexTo: any): [
		IMention[],
		IMention[]
	];
	trimResultText(text: string): string;
	trimSeparatorText(text: string): string;
	checkSeparator(pSeparator: any): [
		text: string | ITextNodeBase,
		separator: ISeparatorsNode,
		checked: boolean
	];
	pushToPipe(value: T): void;
	addToPipe(pSeparator?: any): boolean;
	findBrackets(): boolean;
	findSeparator(separator: any): any;
	getNext(): T;
	getAll(): T[];
	getRest(): T[];
	[Symbol.iterator](): Generator<T, void, unknown>;
}
export declare const enum EnumIncludeSeparatorMode {
	INCLUDE_SEPARATOR_NONE = "NONE",
	INCLUDE_SEPARATOR_SEPARATELY = "SEPARATELY",
	INCLUDE_SEPARATOR_LEFT = "LEFT",
	INCLUDE_SEPARATOR_RIGHT = "RIGHT",
	INCLUDE_SEPARATOR_ONLY = "ONLY"
}
export declare const INCLUDE_SEPARATOR_NONE = EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_NONE;
export declare const INCLUDE_SEPARATOR_SEPARATELY = EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_SEPARATELY;
export declare const INCLUDE_SEPARATOR_LEFT = EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_LEFT;
export declare const INCLUDE_SEPARATOR_RIGHT = EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_RIGHT;
export declare const INCLUDE_SEPARATOR_ONLY = EnumIncludeSeparatorMode.INCLUDE_SEPARATOR_ONLY;
export default splitSmartly;

export {};
