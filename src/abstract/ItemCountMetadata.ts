import { Field, Int, ObjectType } from "type-graphql";

export default function ItemCountMetadata() {
  @ObjectType({ isAbstract: true })
  abstract class ItemCountMetadataClass {
    @Field(() => String)
    name: string;

    @Field(() => Int)
    count: number;
  }
  return ItemCountMetadataClass;
}
