import * as chevrotain from 'chevrotain';
declare var SelectLexer: chevrotain.Lexer;
declare function SelectParser(input: any): void;
declare namespace SelectParser {
    var prototype: any;
}
export { SelectLexer, SelectParser };
