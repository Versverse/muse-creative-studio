package com.example.studio;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
class StudioController {
  private final StudioMapper mapper;
  private final TaskProcessor processor;
  private final Path dir;

  StudioController(
      StudioMapper mapper, TaskProcessor processor, @Value("${studio.upload-dir}") String dir)
      throws IOException {
    this.mapper = mapper;
    this.processor = processor;
    this.dir = Path.of(dir).toAbsolutePath().normalize();
    Files.createDirectories(this.dir);
  }

  private String user(String value) {
    if (value == null || !value.matches("[a-zA-Z0-9_-]{1,40}"))
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "无效的用户标识");
    return value;
  }

  @GetMapping("/templates")
  List<Template> templates() {
    return mapper.templates();
  }

  @GetMapping("/templates/{id}")
  Template template(@PathVariable String id) {
    Template t = mapper.template(id);
    if (t == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "模板不存在");
    return t;
  }

  @GetMapping("/tasks")
  List<Task> tasks(@RequestHeader("X-User") String u) {
    return mapper.tasks(user(u));
  }

  @GetMapping("/tasks/{id}")
  Task task(@PathVariable String id, @RequestHeader("X-User") String u) {
    Task t = mapper.task(id, user(u));
    if (t == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "任务不存在");
    return t;
  }

  @PostMapping(value = "/tasks", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  ResponseEntity<Task> create(
      @RequestHeader("X-User") String u,
      @RequestParam String templateId,
      @RequestParam("files") List<MultipartFile> files)
      throws IOException {
    u = user(u);
    Template t = template(templateId);
    if (files.size() != t.requiredImageCount)
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "图片数量不符合模板要求");
    for (MultipartFile f : files) {
      if (f.isEmpty()
          || f.getSize() > t.maxFileSizeBytes
          || !("image/jpeg".equals(f.getContentType()) || "image/png".equals(f.getContentType())))
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "仅支持 5MB 内的 JPEG 或 PNG 图片");
      try (var input = f.getInputStream()) {
        byte[] h = input.readNBytes(8);
        boolean png =
            h.length == 8 && Arrays.equals(h, new byte[] {(byte) 137, 80, 78, 71, 13, 10, 26, 10});
        boolean jpg =
            h.length >= 3 && (h[0] & 255) == 255 && (h[1] & 255) == 216 && (h[2] & 255) == 255;
        if (("image/png".equals(f.getContentType()) && !png)
            || ("image/jpeg".equals(f.getContentType()) && !jpg))
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "图片内容与声明的格式不一致");
      }
    }
    List<Path> saved = new ArrayList<>();
    try {
      List<String> urls = new ArrayList<>();
      for (MultipartFile f : files) {
        String name =
            UUID.randomUUID() + ("image/png".equals(f.getContentType()) ? ".png" : ".jpg");
        Path path = dir.resolve(name);
        saved.add(path);
        f.transferTo(path);
        urls.add("/uploads/" + name);
      }
      Task task = new Task();
      task.id = UUID.randomUUID().toString();
      task.userId = u;
      task.templateId = t.id;
      task.templateTitle = t.title;
      task.status = "WAITING";
      task.stage = "WAITING";
      task.inputs = String.join(",", urls);
      mapper.insert(task);
      processor.submit(new Task(task));
      return ResponseEntity.status(HttpStatus.ACCEPTED).body(task);
    } catch (Exception e) {
      for (Path path : saved) Files.deleteIfExists(path);
      throw e;
    }
  }
}
