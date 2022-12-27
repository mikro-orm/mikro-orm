export interface OperatorMap<T> {
  $geoWithin?: object;
  $geometry?: object;
  $geoIntersects?: object;
  $near?: object;
  $nearSphere?: object;
  $type?: any;
  $expr?: object;
  $jsonSchema?: object;
  $mod?: [number, number];
  $text?: any;
  $where?: object;
  $all?: any;
  $elemMatch?: any;
  $size?: any;
  $bitsAllClear?: any;
  $bitsAllSet?: any;
  $bitsAnyClear?: any;
  $bitsAnySet?: any;
  $comment?: any;
}
