/**
 * A freshly allocated number. The raw `value` and `period` are kept beside the printed `number`
 * so a row can be sorted and re-printed later without re-parsing the string it displays.
 */
export interface AllocatedNumber {
  number: string;
  value: number;
  period: string;
}
