import { Field, ObjectType, Int } from "type-graphql";

@ObjectType()
export default class SelectionOption {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;
}
