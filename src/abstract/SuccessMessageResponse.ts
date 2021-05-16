import { Field, ObjectType } from "type-graphql";

@ObjectType()
export default class SuccessMessageResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => String)
  message: string;
}
