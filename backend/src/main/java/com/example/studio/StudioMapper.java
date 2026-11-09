package com.example.studio;

import java.util.List;
import org.apache.ibatis.annotations.*;

@Mapper
interface StudioMapper {
  @Select("SELECT * FROM templates ORDER BY id")
  List<Template> templates();

  @Select("SELECT * FROM templates WHERE id=#{id}")
  Template template(String id);

  @Insert(
      "INSERT INTO tasks(id,user_id,template_id,template_title,status,stage,inputs)"
          + " VALUES(#{id},#{userId},#{templateId},#{templateTitle},#{status},#{stage},#{inputs})")
  void insert(Task task);

  @Select("SELECT * FROM tasks WHERE user_id=#{userId} ORDER BY created_at DESC,id DESC")
  List<Task> tasks(String userId);

  @Select("SELECT * FROM tasks WHERE id=#{id} AND user_id=#{userId}")
  Task task(@Param("id") String id, @Param("userId") String userId);

  @Update(
      "UPDATE tasks SET status=#{status},stage=#{stage},error=#{error},result_url=#{resultUrl}"
          + " WHERE id=#{id} AND status NOT IN ('SUCCESS','FAILED')")
  int update(Task task);
}
