//

import Parsimmon from "parsimmon";
import {
  Parser,
  alt,
  lazy,
  seq,
  seqMap
} from "parsimmon";
import {
  Akrantiain,
  Circumflex,
  Disjunction,
  Identifier,
  Matchable,
  Module,
  ModuleChain,
  ModuleChainName,
  ModuleName,
  Quote,
  Sequence
} from "../class";
import {
  attempt
} from "./util";


export class Parsers {

  public static explicitModule: Parser<Module> = lazy(() => {
    let parser = seq(
      seq(Parsimmon.string("%"), Parsers.blank),
      Parsers.moduleName,
      seq(Parsers.blank, Parsimmon.string("{"), Parsers.blank),
      Parsers.moduleContent,
      seq(Parsers.blank, Parsimmon.string("}"))
    ).map(([, name, , content]) => {
      let module = new Module(name, content);
      return module;
    });
    return parser;
  });

  public static moduleContent: Parser<ModuleChain> = lazy(() => {
    let parser = Parsers.moduleChain;
    return parser;
  });

  public static moduleChain: Parser<ModuleChain> = lazy(() => {
    let chainParser = Parsers.moduleChainElement.sepBy1(Parsimmon.string(">>").trim(Parsers.blank)).map((chainElements) => {
      let chain = [];
      for (let chainElement of chainElements) {
        chain.push(...chainElement);
      }
      return chain;
    });
    let parser = seq(Parsimmon.string("%%"), Parsers.blank, chainParser).map((results) => results[2]);
    return parser;
  });

  // モジュールチェイン素をパースします。
  // パースした結果は、推移型モジュールを 1 つずつに分解したモジュール名の配列になります。
  // 例えば、「A => B => C => D」という文字列は、「A => B」と「B => C」と「C => D」の 3 つのモジュール名からなる配列にパースされます。
  public static moduleChainElement: Parser<ModuleChain> = lazy(() => {
    let innerParser = Parsers.identifier.sepBy1(Parsimmon.string("=>").trim(Parsers.blank));
    let parenedParser = innerParser.thru(Parsers.parened);
    let parser = alt(parenedParser, innerParser).map((strings) => {
      if (strings.length === 1) {
        return [strings[0]];
      } else {
        let names = [];
        for (let i = 0 ; i < strings.length - 1; i ++) {
          let name = [strings[i], strings[i + 1]] as ModuleChainName;
          names.push(name);
        }
        return names;
      }
    });
    return parser;
  });

  public static moduleName: Parser<ModuleName> = lazy(() => {
    let parser = alt(Parsers.moduleChainName.thru(attempt), Parsers.moduleSimpleName);
    return parser;
  });

  public static moduleSimpleName: Parser<Identifier> = lazy(() => {
    return Parsers.identifier;
  });

  public static moduleChainName: Parser<ModuleChainName> = lazy(() => {
    let parser = seq(
      Parsers.identifier,
      seq(Parsimmon.string("=>").trim(Parsers.blank)),
      Parsers.identifier
    ).map(([first, , second]) => {
      let name = [first, second] as ModuleChainName;
      return name;
    });
    return parser;
  });

  public static disjunction: Parser<Disjunction> = lazy(() => {
    let parser = Parsers.sequence.sepBy1(Parsimmon.string("|").trim(Parsers.blank)).map((sequences) => new Disjunction(sequences, false));
    return parser;
  });

  public static sequence: Parser<Sequence> = lazy(() => {
    let parser = Parsers.selection.sepBy1(Parsers.blank).map((selections) => new Sequence(selections));
    return parser;
  });

  public static condition: Parser<unknown> = lazy(() => {
    let parser = seq(
      Parsimmon.string("!"),
      Parsers.blank,
      Parsers.selection
    ).map(([, , selection]) => {
      let condition = new Disjunction([selection], true);
      return condition;
    });
    return parser;
  });

  public static selection: Parser<Matchable> = lazy(() => {
    let disjunctionParser = Parsers.disjunction.thru(Parsers.parened);
    let parser = alt(Parsers.quote, Parsers.circumflex, Parsers.identifier, disjunctionParser);
    return parser;
  });

  public static quote: Parser<Quote> = lazy(() => {
    let parser = seq(
      Parsimmon.string("\""),
      alt(Parsers.quoteEscape, Parsers.quoteContent).many().tie(),
      Parsimmon.string("\"")
    ).map(([, string]) => {
      let quote = new Quote(string);
      return quote;
    });
    return parser;
  });

  public static quoteEscape: Parser<string> = lazy(() => {
    let parser = seq(
      Parsimmon.string("\\"),
      alt(Parsimmon.regexp(/u[A-Fa-f0-9]{4}/), Parsimmon.oneOf("\\\""))
    ).map(([, escape]) => {
      if (escape.startsWith("u")) {
        let code = parseInt(escape.substr(1, 4), 16);
        let char = String.fromCharCode(code);
        return char;
      } else {
        return escape;
      }
    });
    return parser;
  });

  public static quoteContent: Parser<string> = lazy(() => {
    let parser = Parsimmon.noneOf("\\\"");
    return parser;
  });

  public static circumflex: Parser<Circumflex> = lazy(() => {
    let parser = Parsimmon.string("^").result(new Circumflex());
    return parser;
  });

  public static identifier: Parser<Identifier> = lazy(() => {
    let parser = Parsimmon.regexp(/[a-zA-Z][a-zA-Z0-9_]*/).map((string) => new Identifier(string));
    return parser;
  });

  public static blank: Parser<null> = lazy(() => {
    let parser = Parsimmon.regexp(/[^\S\n]*/).result(null);
    return parser;
  });

  private static parened<T>(parser: Parser<T>): Parser<T> {
    let leftParser = seq(Parsimmon.string("("), Parsers.blank);
    let rightParser = seq(Parsers.blank, Parsimmon.string(")"));
    let wrappedParser = seq(leftParser, parser, rightParser).map((result) => result[1]);
    return wrappedParser;
  }

}