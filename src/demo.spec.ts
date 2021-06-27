import { IIncludeSeparatorMode, IParametersSplitSmartly } from './types';
import splitSmartly from './index';
import { inspect } from 'util';

describe(`demos`, () =>
{

	([

		['one _ two _ "three _ four" _ five _ six', '_'],
		['one _ two _ "three _ four" _ five _ six', '_', { brackets: true }],

		['(one / two) / "three / four" / <<five / six>>', '/', { brackets: [['(', ')'], ['<<', '>>']] }],
		['(one / two) / "three / four" / <<five / six>>', '/', { brackets: { '(': ')', '<<': '>>' } }],
		['(one / two) / "three / four" / <<five / six>>', '/', { brackets: '(), << >>' }],

		['SELECT best FROM life', ['SELECT ', 'FROM ']],
		['p1: point first p2: point second',  /p\d:/gi],
		['SELECT best FROM life', ['SELECT ', 'FROM '], { includeSeparatorMode: 'SEPARATELY'}],
		['SELECT best FROM life', ['SELECT ', 'FROM '], { includeSeparatorMode: 'RIGHT' }],
		['SELECT best FROM life', ['SELECT ', 'FROM '], { includeSeparatorMode: 'ONLY' }],

		['select best FROM life', ['SELECT ', 'FROM '], { includeSeparatorMode: 'RIGHT' }],
		['select best FROM life', ['SELECT ', 'FROM '], { includeSeparatorMode: 'RIGHT', ignoreCase: false }],

		['Peter loves Mary and Mary loves Johnny and Jonny loves Steve', 'AND', { mentions: ['STEVE', 'PETER'] }],

		['One | Two | Three | Four', '|', { indexes: [1, 3] }],
		['One | Two | Three | Four', '|', { indexes: 2 }],

	] as IParametersSplitSmartly<IIncludeSeparatorMode>[])
		.forEach((argv) => {

			test(inspect(argv), () =>
			{
				let actual = splitSmartly(...argv as any);

				expect(actual).toMatchSnapshot();
			});

		})
	;

})
