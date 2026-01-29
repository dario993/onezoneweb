export function isString(oItem: unknown): boolean {
  return typeof oItem === "string";
}

export function isset(val: unknown, bLengthCheck: boolean = false): boolean {
  // eslint-disable-next-line id-blacklist
  if (
    val !== undefined &&
    val !== null &&
    val !== "undefined" &&
    val !== "null"
  ) {
    if (
      bLengthCheck &&
      // Strings dürfen nicht leer sein
      ((isString(val) && (val as string).length === 0) ||
        // Objekte müssen Keys besitzen
        (val !== null &&
          typeof val === "object" &&
          Object.keys(val as object).length === 0) ||
        // Arrays müssen Elemente enthalten
        (Array.isArray(val) && (val as unknown[]).length === 0))
    ) {
      return false;
    }
    return true;
  }
  return false;
}

export function isTrue(oValue: unknown): boolean {
  return oValue === "true" || oValue === "1" || oValue === true || oValue === 1;
}

export function trim<T>(oItem: T): T {
  if (isString(oItem)) {
    return (oItem as unknown as string).trim() as unknown as T;
  }
  return oItem;
}

export function convertStringToJSON<T>(sJSON: string, oDefault: T): T {
  try {
    if (isset(sJSON) && sJSON.length > 0) {
      sJSON = sJSON.replace(/(?:\r\n|\r|\n)/g, "");
      return JSON.parse(sJSON) as T;
    }
    return oDefault;
  } catch (error) {
    console.log(error);
    return oDefault;
  }
}

export function isObject(item: unknown): boolean {
  return typeof item === "object" && !Array.isArray(item);
}

export function isArray(item: unknown): boolean {
  return item instanceof Array;
}

export function deepMergeObject<T, Z, U>(oObj1: Z, oObj2: U): T {
  const obj1: Record<string, any> = oObj1 as unknown as Record<string, any>;
  const obj2: Record<string, any> = oObj2 as unknown as Record<string, any>;
  if (!isset(obj1) || !isset(obj2)) {
    return {} as T;
  }
  const obj3: Record<string, any> = {};
  Object.keys(obj1).forEach((key: string): void => {
    if (obj1[key] === null || obj1[key] === undefined) {
      obj3[key] = obj1[key];
    } else if (isObject(obj1[key]) && !isArray(obj1[key])) {
      obj3[key] = deepMergeObject({}, obj1[key]);
    } else if (isArray(obj1[key])) {
      obj3[key] = cleanupArray(obj1[key] as unknown[]);
    } else {
      obj3[key] = trim(obj1[key]);
    }
  });
  Object.keys(obj2).forEach((key: string): void => {
    if (isset(obj3[key])) {
      if (obj2[key] === null || obj2[key] === undefined) {
        obj3[key] = obj2[key];
      } else if (isObject(obj2[key]) && !isArray(obj2[key])) {
        if (isObject(obj3[key])) {
          obj3[key] = deepMergeObject(obj3[key], obj2[key]);
        } else {
          obj3[key] = deepMergeObject({}, obj2[key]);
        }
      } else if (isArray(obj2[key])) {
        obj3[key] = cleanupArray(
          (obj3[key] as unknown[]).concat(obj2[key] as unknown[])
        );
      } else {
        obj3[key] = trim(obj2[key]);
      }
    } else {
      if (obj2[key] === null || obj2[key] === undefined) {
        obj3[key] = obj2[key];
      } else if (isObject(obj2[key]) && !isArray(obj2[key])) {
        obj3[key] = deepMergeObject({}, obj2[key]);
      } else if (isArray(obj2[key])) {
        obj3[key] = cleanupArray(obj2[key] as unknown[]);
      } else {
        obj3[key] = trim(obj2[key]);
      }
    }
  });
  return obj3 as unknown as T;
}

export function cleanupArray<T>(aArray: T): T {
  return (aArray as unknown as Array<Record<string, any> | unknown>).map(
    (oItem: Record<string, any> | unknown): unknown => {
      if (isObject(oItem) && !isArray(oItem)) {
        return deepMergeObject(oItem as Record<string, any>, {});
      } else if (isArray(oItem)) {
        return cleanupArray(oItem as unknown[]);
      } else {
        return trim(oItem);
      }
    }
  ) as unknown as T;
}

export function cleanupObject<T>(oObj: T): T {
  return deepMergeObject(oObj, {});
}

export function convertJSONToString<T>(
  oItem: T,
  bFormated: boolean = false
): string {
  let sJSON: string = "";
  if (isArray(oItem)) {
    oItem = cleanupArray(oItem);
  } else if (isObject(oItem)) {
    oItem = cleanupObject(oItem);
  }
  if (bFormated) {
    sJSON = JSON.stringify(oItem, null, 4);
  } else {
    sJSON = JSON.stringify(oItem);
  }
  return sJSON;
}

export function clone<T>(oItem: T): T {
  const jsonString: string = JSON.stringify(oItem);
  const clonedObject: T = JSON.parse(jsonString) as T;
  return clonedObject;
}

export function getMonthFormatted(dtDate: Date): string {
  const iMonth: number = dtDate.getMonth() + 1;
  return iMonth < 10 ? "0" + String(iMonth) : String(iMonth);
}

export function getDayFormatted(dtDate: Date): string {
  const iDay: number = dtDate.getDate();
  return iDay < 10 ? "0" + String(iDay) : String(iDay);
}

export function normalizeTimestamp(iValue: number): number {
  if (isNaN(iValue)) {
    return iValue;
  }
  if (iValue > 9999999999) {
    return Math.trunc(iValue / 1000);
  }
  return Math.trunc(iValue);
}

export function padStart<T>(sString: T, iLength: number, sPad: string): string {
  let sOutput: string = String(sString);
  while (sOutput.length < iLength) {
    sOutput = sPad + sOutput;
  }
  return sOutput;
}

export function getDatetimeFromTimestamp(
  iTimestamp: number,
  bTime: boolean = true,
  bDate: boolean = true,
  bWeekday: boolean = false
): string {
  let sDate: string = "";
  let sTime: string = "";
  const dtDate: Date = new Date(normalizeTimestamp(iTimestamp) * 1000);
  if (bDate) {
    if (bWeekday) {
      const aWeekdayShort: string[] = [
        "So",
        "Mo",
        "Di",
        "Mi",
        "Do",
        "Fr",
        "Sa",
      ];
      sDate += aWeekdayShort[dtDate.getDay()] + " ";
    }
    sDate += padStart(String(dtDate.getDate()), 2, "0") + ".";
    sDate +=
      padStart(String(dtDate.getMonth() + 1), 2, "0") +
      "." +
      String(dtDate.getFullYear());
  }
  if (bTime) {
    sTime += " ";
    sTime += padStart(String(dtDate.getHours()), 2, "0") + ":";
    sTime += padStart(String(dtDate.getMinutes()), 2, "0") + ":";
    sTime += padStart(String(dtDate.getSeconds()), 2, "0");
  }
  return (sDate + sTime).trim();
}

export async function delay(ms: number): Promise<void> {
  return new Promise((resolve: Function): any =>
    setTimeout((): void => {
      resolve();
    }, ms)
  );
}
