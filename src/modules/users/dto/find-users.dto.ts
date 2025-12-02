import { Param } from "@nestjs/common";
import { IsBoolean, IsOptional } from "class-validator";

export class FindUsersDto {

    @IsOptional()
    @IsBoolean()
    subscribed: boolean;
}