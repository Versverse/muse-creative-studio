package com.example.studio;

import java.nio.file.Path;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
class WebConfig implements WebMvcConfigurer {
  @Value("${studio.upload-dir}")
  String dir;

  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    registry
        .addResourceHandler("/uploads/**")
        .addResourceLocations(Path.of(dir).toAbsolutePath().normalize().toUri().toString());
  }
}
