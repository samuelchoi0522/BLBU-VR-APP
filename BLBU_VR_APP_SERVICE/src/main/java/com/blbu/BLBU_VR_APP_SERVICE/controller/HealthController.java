package com.blbu.BLBU_VR_APP_SERVICE.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/health")
    public String healthCheck() {
        return "BLBU VR App Service is healthy";
    }
}
