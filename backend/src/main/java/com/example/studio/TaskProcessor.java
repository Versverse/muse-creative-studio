package com.example.studio;

import jakarta.annotation.PreDestroy;
import java.util.concurrent.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
class TaskProcessor {
  private final StudioMapper mapper;
  private final long delay;
  private final String failure;
  private final ExecutorService executor = Executors.newFixedThreadPool(3);

  TaskProcessor(
      StudioMapper mapper,
      @Value("${studio.step-ms}") long delay,
      @Value("${studio.fail-stage}") String failure) {
    this.mapper = mapper;
    this.delay = Math.max(0, delay);
    this.failure = failure;
  }

  void submit(Task task) {
    executor.submit(() -> process(task));
  }

  void process(Task task) {
    try {
      for (String stage : new String[] {"CHECK", "GENERATE", "FINALIZE"}) {
        task.stage = stage;
        task.status = "PROCESSING";
        mapper.update(task);
        if (delay > 0) Thread.sleep(delay);
        if (stage.equalsIgnoreCase(failure)) throw new IllegalStateException("模拟失败：" + stage);
      }
      task.resultUrl = task.inputs.split(",")[0];
      task.status = "SUCCESS";
      mapper.update(task);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      task.status = "FAILED";
      task.error = "任务处理被中断";
      mapper.update(task);
    } catch (Exception e) {
      task.status = "FAILED";
      task.error = e.getMessage() == null ? "处理失败" : e.getMessage();
      mapper.update(task);
    }
  }

  @PreDestroy
  void shutdown() {
    executor.shutdownNow();
  }
}
