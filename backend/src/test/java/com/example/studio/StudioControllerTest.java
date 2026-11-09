package com.example.studio;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

class StudioControllerTest {
  @TempDir Path uploadDir;

  private Template template() {
    Template t = new Template();
    t.id = "pet";
    t.title = "宠物";
    t.requiredImageCount = 1;
    t.maxFileSizeBytes = 1024;
    return t;
  }

  @Test
  void rejectsFileWhoseContentDoesNotMatchDeclaredType() throws Exception {
    StudioMapper mapper = mock(StudioMapper.class);
    when(mapper.template("pet")).thenReturn(template());
    StudioController controller =
        new StudioController(mapper, mock(TaskProcessor.class), uploadDir.toString());
    byte[] jpegHeader = {(byte) 0xff, (byte) 0xd8, (byte) 0xff, 0};
    MockMultipartFile file = new MockMultipartFile("files", "fake.png", "image/png", jpegHeader);
    ResponseStatusException error =
        assertThrows(
            ResponseStatusException.class, () -> controller.create("demo-a", "pet", List.of(file)));
    assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
    verify(mapper, never()).insert(any());
  }

  @Test
  void acceptedResponseIsNotMutatedByTheWorker() throws Exception {
    StudioMapper mapper = mock(StudioMapper.class);
    TaskProcessor processor = mock(TaskProcessor.class);
    when(mapper.template("pet")).thenReturn(template());
    doAnswer(
            invocation -> {
              Task task = invocation.getArgument(0);
              task.status = "PROCESSING";
              return null;
            })
        .when(processor)
        .submit(any());
    StudioController controller = new StudioController(mapper, processor, uploadDir.toString());
    byte[] pngHeader = {(byte) 137, 80, 78, 71, 13, 10, 26, 10};
    MockMultipartFile file = new MockMultipartFile("files", "sample.png", "image/png", pngHeader);
    var response = controller.create("demo-a", "pet", List.of(file));
    assertEquals(HttpStatus.ACCEPTED, response.getStatusCode());
    assertEquals("WAITING", response.getBody().status);
    verify(mapper).insert(any());
    verify(processor).submit(any());
  }
}
