package com.example.HiMade.user.controller.InquiryController;

import com.example.HiMade.admin.dto.StoreRegistDTO;
import com.example.HiMade.user.dto.UserChatDTO;
import com.example.HiMade.user.service.UserChatRoomService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class UserChatRoomController {

    private static final Logger logger = LoggerFactory.getLogger(UserChatRoomController.class);

    @Autowired
    private UserChatRoomService userChatRoomService;

    @PostMapping("/save")
    public ResponseEntity<?> saveMessage(@RequestBody UserChatDTO userChatDTO) {
        // 들어온 요청 로그 찍기
        logger.info("로그 컨트롤러 Received message data: {}", userChatDTO);

        // 필수 값 체크 및 로그 기록
        if (userChatDTO.getStoreId() == null) {
            logger.error("storeId 값이 없습니다.");
            return ResponseEntity.badRequest().body("storeId 값이 없습니다.");
        }

        if (userChatDTO.getUserId() == null) {
            logger.error("userId 값이 없습니다.");
            return ResponseEntity.badRequest().body("userId 값이 없습니다.");
        }

        if (userChatDTO.getChatMessage() == null || userChatDTO.getChatMessage().trim().isEmpty()) {
            logger.error("메시지가 없습니다.");
            return ResponseEntity.badRequest().body("메시지가 없습니다.");
        }

        // 메시지 저장 시도
        try {
            logger.info("메시지 저장 시도: {}", userChatDTO);
            userChatRoomService.insertChat(userChatDTO);
            logger.info("메시지 저장 성공");
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("메시지 저장 중 오류 발생", e);
            return ResponseEntity.status(500).body("메시지 저장 중 오류가 발생했습니다.");
        }
    }


    // 채팅 기록 불러오기
    @GetMapping("/history")
    public List<UserChatDTO> getChatHistory(@RequestParam String userId, @RequestParam String storeId) {
        return userChatRoomService.selectChat(userId, storeId);
    }

    // 현재 로그인된 사용자 확인
    @GetMapping("/current")
    public ResponseEntity<?> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.ok(Map.of("userId", auth.getName()));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    // 채팅 목록 조회
    @GetMapping("/list")
    public ResponseEntity<?> getChatList(@RequestParam String userId) {
        try {
            // 현재 로그인한 사용자와 요청된 userId가 일치하는지 확인
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (!auth.getName().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("접근 권한이 없습니다.");
            }

            List<Map<String, Object>> chatList = userChatRoomService.getChatListForUser(userId);
            return ResponseEntity.ok(chatList);
        } catch (Exception e) {
            logger.error("채팅 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("채팅 목록을 불러오는 중 오류가 발생했습니다.");
        }
    }

    // store_id 기반 가게 조회 (임시)
    @GetMapping("/getStoreInfoByStoreId/{storeId}")
    public ResponseEntity<StoreRegistDTO> getStoreInfoByStoreId(@PathVariable String storeId) {
        System.out.println( "가게 정보 띄우기" + userChatRoomService.getStoreInfoByStoreId(storeId));
        StoreRegistDTO storeInfo = userChatRoomService.getStoreInfoByStoreId(storeId);
        if (storeInfo != null) {
            return ResponseEntity.ok(storeInfo);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

}
