package com.example.studio;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.*;
import org.junit.jupiter.api.Test;

class TaskProcessorTest {
  @Test
  void runsInOrderAndFinishes() {
    StudioMapper m = mock(StudioMapper.class);
    List<String> events = new ArrayList<>();
    doAnswer(
            i -> {
              Task t = i.getArgument(0);
              events.add(t.status + ":" + t.stage);
              return 1;
            })
        .when(m)
        .update(any());
    Task t = new Task();
    t.inputs = "/uploads/a.png";
    new TaskProcessor(m, 0, "NONE").process(t);
    assertEquals(
        List.of(
            "PROCESSING:CHECK", "PROCESSING:GENERATE", "PROCESSING:FINALIZE", "SUCCESS:FINALIZE"),
        events);
    assertEquals("/uploads/a.png", t.resultUrl);
  }

  @Test
  void failureStopsLaterStages() {
    StudioMapper m = mock(StudioMapper.class);
    List<String> stages = new ArrayList<>();
    doAnswer(
            i -> {
              Task t = i.getArgument(0);
              stages.add(t.stage);
              return 1;
            })
        .when(m)
        .update(any());
    Task t = new Task();
    t.inputs = "/uploads/a.png";
    new TaskProcessor(m, 0, "GENERATE").process(t);
    assertEquals("FAILED", t.status);
    assertEquals(List.of("CHECK", "GENERATE", "GENERATE"), stages);
    assertTrue(t.error.contains("GENERATE"));
  }
}
