package com.example.HiMade.admin.dto;

import lombok.*;

import java.time.LocalDate;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@ToString
@Builder
public class DayOffDTO {

    private Long dayId; //업체휴무pk

    private DayOffDay dayOffDay; //고정
    private DayOffSet dayOffSet; //지정

    private String storeId; //업체아이디
    private Long storeNo; //업체번호
}
