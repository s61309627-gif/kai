




# 清空环境
rm(list = ls())

# 加载包
library(MetaboAnalystR)
cluster_de <- read.csv('/home/kyky2/空代/intestine/DE_Results_FullSpots/INTESTINE_Global_FullSpots_Wilcox_DE_Annotated_Fast.csv')
# 1. 筛选显著差异代谢物 (以某个 Cluster 为例)
sig_metabolites <- cluster_de %>%
  filter(Cluster == "粘膜下（Submucosa）") %>%

  pull(HMDB)
# 你的代谢物列表
tmp.vec <- sig_metabolites

# 1. 初始化对象
mSet <- InitDataObjects("conc", "pathora", FALSE, default.dpi = 72)

# 2. 导入代谢物列表
mSet <- Setup.MapData(mSet, tmp.vec)

# 3. 自动匹配数据库（name → ID）
mSet <- CrossReferencing(mSet, "hmdb")

# 查看匹配结果
mSet$name.map

# 4. 创建匹配结果表
mSet <- CreateMappingResultTable(mSet)

# 6. 关闭代谢组过滤
mSet <- SetMetabolomeFilter(mSet, F)

# 7. 选择富集数据库：smpdb_pathway（代谢组最常用通路库）
mSet <- SetCurrentMsetLib(mSet, "smpdb_pathway", 0)

# 8. 计算富集（超几何分布检验）
mSet <- CalculateHyperScore(mSet)

# 9. 绘图：富集柱状图 → 自动保存为 ora_0_.png
mSet <- PlotORA(mSet, "ora_0_", "bar", "png", 72, width=NA)

# 10. 查看富集结果表格
enrich_result <- mSet$analSet$ora.mat
View(enrich_result)

# ======================
# 清空环境 + 加载包
# ======================
rm(list = ls())
# 清空环境
rm(list=ls())



library(MetaboAnalystR)
library(tidyverse)

# ==============================
# 批量代谢组富集函数（小鼠 / 人类通用）
# 使用方法：run_met_enrich("你的文件路径.csv")
# ==============================
run_met_enrich <- function(file_path) {
  
  # 1. 自动获取器官名（从文件名）
  file_name <- basename(file_path)
  organ_name <- strsplit(file_name, "_")[[1]][1]
  
  # 2. 自动创建输出文件夹
  out_dir <- paste0("/home/kyky2/空代/code for 网站/page_3/", organ_name)
  dir.create(out_dir, recursive = TRUE, showWarnings = FALSE)
  cat("📁 输出文件夹：", out_dir, "\n")
  
  # 3. 读取差异代谢物表格
  cluster_de <- read.csv(file_path)
  
  # 4. 获取所有Cluster
  all_clusters <- unique(cluster_de$Cluster)
  cat("🔍 检测到", length(all_clusters), "个Cluster：\n")
  print(all_clusters)
  
  # 5. 循环每个Cluster做富集
  for(clust in all_clusters) {
    
    cat("\n====================================\n")
    cat("正在处理：", clust, "\n")
    
    # 提取HMDB ID
    sig_mets <- cluster_de %>%
      filter(Cluster == clust) %>%
      pull(HMDB) %>%
      na.omit() %>%
      unique()
    
    if(length(sig_mets) < 1) {
      cat("⚠️ 无有效代谢物，跳过\n")
      next
    }
    
    # MetaboAnalystR 富集流程
    mSet <- InitDataObjects("conc", "pathora", FALSE, default.dpi = 72)
    mSet <- Setup.MapData(mSet, sig_mets)
    mSet <- CrossReferencing(mSet, "hmdb")
    mSet <- CreateMappingResultTable(mSet)
    mSet <- SetMetabolomeFilter(mSet, F)
    mSet <- SetCurrentMsetLib(mSet, "smpdb_pathway", 0)
    mSet <- CalculateHyperScore(mSet)
    
    # 保存图片
    plot_name <- file.path(out_dir, paste0("cluster_", gsub("[^a-zA-Z0-9]", "_", clust), "_plot"))
    mSet <- PlotORA(mSet, plot_name, "bar", "png", 72, width=NA)
    
    # 保存富集结果
    res_df <- mSet$analSet$ora.mat
    res_path <- file.path(out_dir, paste0("cluster_", gsub("[^a-zA-Z0-9]", "_", clust), "_enrich_result.csv"))
    write.csv(res_df, res_path, row.names = TRUE)
    
    cat("✅ 完成：", clust, "\n")
  }
  
  cat("\n🎉 全部完成！所有结果在：", out_dir, "\n")
}