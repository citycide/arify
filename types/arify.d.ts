declare module 'arify' {
  type Descriptor = {
    type?: string;
    cls?: Function;
    test?: (value: any) => boolean;
    description: string;
    defaultValue?: any;
    defaultGenerator?: () => any;
    any?: boolean;
  }

  class Arify {
    add (name: string, descriptor: Descriptor): this;
    any (name: string, defaultValue?: any): this;
    anyForm (): this;
    array (name: string, defaultValue?: Array<any>): this;
    boolean (name: string, defaultValue?: boolean): this;
    cls (name: string, cls: Function, description: string, defaultValue?: Function): this;
    date (name: string, defaultValue?: Date): this;
    empty (): this;
    form (...names: Array<string>): this;
    function (name: string, defaultValue?: Function): this;
    match (name: string, regExp: RegExp, description: string, defaultValue?: string): this;
    nonEmpty (): this;
    number (name: string, defaultValue?: number): this;
    object (name: string, defaultValue?: Object): this;
    regExp (name: string, defaultValue?: RegExp): this;
    string (name: string, defaultValue?: string): this;
    test (name: string, testFn: (value: any) => boolean, description: string, defaultValue?: any): this;
    type (name: string, type: string, description: string, defaultValue?: any): this;

    fn (name: string, defaultValue?: Function): this;
    fun (name: string, defaultValue?: Function): this;
    arr (name: string, defaultValue?: Array<any>): this;
    obj (name: string, defaultValue?: Object): this;
    str (name: string, defaultValue?: string): this;
    num (name: string, defaultValue?: number): this;
    reg (name: string, defaultValue?: RegExp): this;
    bln (name: string, defaultValue?: boolean): this;
  }

  function arify (
    setup: (v: Arify) => void,
    fn: (args: Object, rest: Array<string>, form: Array<string>) => any,
    context?: Object
  ): Function;

  export = arify;
}
