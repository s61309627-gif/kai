library(tidyverse)
library(MetaboAnalystR)

# ============================================================
# 代谢物富集函数
# ============================================================
run_met_enrich <- function(file_path) {

  file_name <- basename(file_path)
  organ_name <- strsplit(file_name, "_")[[1]][1]

  out_dir <- paste0("/home/kyky2/空代/code for 网站/page_3/", organ_name)
  dir.create(out_dir, recursive = TRUE, showWarnings = FALSE)
  cat("输出文件夹：", out_dir, "\n")

  cluster_de <- read.csv(file_path)

  all_clusters <- unique(cluster_de$Cluster)
  cat("检测到", length(all_clusters), "个Cluster：\n")
  print(all_clusters)

  for (clust in all_clusters) {

    cat("\n====================================\n")
    cat("正在处理：", clust, "\n")

    sig_mets <- cluster_de %>%
      filter(Cluster == clust, p_val < 0.05) %>%
      pull(HMDB) %>%
      na.omit() %>%
      unique()

    if (length(sig_mets) < 1) {
      cat("无有效代谢物，跳过\n")
      next
    }

    mSet <- InitDataObjects("conc", "pathora", FALSE, default.dpi = 72)
    mSet <- Setup.MapData(mSet, sig_mets)
    mSet <- CrossReferencing(mSet, "hmdb")
    mSet <- CreateMappingResultTable(mSet)
    mSet <- SetMetabolomeFilter(mSet, F)
    mSet <- SetCurrentMsetLib(mSet, "kegg_pathway", 0)
    mSet <- CalculateHyperScore(mSet)

    plot_name <- file.path(out_dir, paste0("cluster_", gsub("[^a-zA-Z0-9]", "_", clust), "_plot"))
    mSet <- PlotORA(mSet, plot_name, "bar", "png", 72, width = NA)

    res_df <- mSet$analSet$ora.mat
    res_path <- file.path(out_dir, paste0("cluster_", gsub("[^a-zA-Z0-9]", "_", clust), "_enrich_result.csv"))
    write.csv(res_df, res_path, row.names = TRUE)

    cat("完成：", clust, "\n")
  }

  cat("\n全部完成！所有结果在：", out_dir, "\n")
}

# ============================================================
# 9 个器官的文件列表
# ============================================================
file_list <- c(
  HEART     = "/home/kyky2/空代/heart/DE_Results_FullSpots/HEART_Global_FullSpots_Wilcox_DE_Annotated_Fast.csv",
  INTESTINE = "/home/kyky2/空代/intestine/DE_Results_FullSpots/INTESTINE_Global_FullSpots_Wilcox_DE_Annotated_Fast.csv",
  KIDNEY    = "/home/kyky2/空代/kidney/DE_Results_FullSpots/KIDNEY_Global_FullSpots_Wilcox_DE_Annotated_Fast.csv",
  LIVER     = "/home/kyky2/空代/liver/DE_Results_FullSpots/LIVER_Global_FullSpots_Wilcox_DE_Annotated_Fast.csv",
  LUNG      = "/home/kyky2/空代/lung/DE_Results_FullSpots/LUNG_Global_FullSpots_Wilcox_DE_Annotated_Fast.csv",
  LYMPH     = "/home/kyky2/空代/lymph/DE_Results_FullSpots/LYMPH_Global_FullSpots_Wilcox_DE_Annotated_Fast.csv",
  SPLEEN    = "/home/kyky2/空代/spleen/DE_Results_FullSpots/SPLEEN_Global_FullSpots_Wilcox_DE_Annotated_Fast.csv",
  STERNUM   = "/home/kyky2/空代/sternum/DE_Results_FullSpots/STERNUM_Global_FullSpots_Wilcox_DE_Annotated_Fast.csv",
  THYMUS    = "/home/kyky2/空代/thymus/DE_Results_FullSpots/THYMUS_Global_FullSpots_Wilcox_DE_Annotated_Fast.csv"
)

# ============================================================
# 依次对每个器官跑富集
# ============================================================
for (i in seq_along(file_list)) {
  organ <- names(file_list)[i]
  path  <- file_list[i]

  cat("\n")
  cat(strrep("=", 60), "\n")
  cat("【", i, "/", length(file_list), "】开始处理器官：", organ, "\n")
  cat("文件：", path, "\n")
  cat(strrep("=", 60), "\n")

  tryCatch(
    run_met_enrich(path),
    error = function(e) {
      cat("错误：", organ, "处理失败\n")
      cat("错误信息：", e$message, "\n")
    }
  )
}

cat("\n\n所有 9 个器官富集分析完成！\n")
