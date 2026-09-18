"""
CNN Architecture Layer-by-Layer Profiler & Mathematical Operation Calculator.

Provides exact tensor arithmetic, parameter count, MACs, FLOPs, memory footprints,
receptive field progression, and step-by-step mathematical formulas for every operation
in CNN architectures (Conv2d, DepthwiseConv2d, PointwiseConv2d, BatchNorm2d,
ReLU, MaxPool2d, AdaptiveAvgPool2d, Linear/FC, and Residual Additions).
"""

import math
from typing import Dict, Any, List, Optional, Tuple


class CnnProfilerService:
    """Rigorous analytical profiler for CNN layer operations."""

    @staticmethod
    def calculate_conv_output_dim(dim_in: int, kernel: int, stride: int = 1, padding: int = 0, dilation: int = 1) -> int:
        """Calculate spatial dimension for Convolution: floor((dim_in + 2*pad - dilation*(kernel-1) - 1)/stride) + 1"""
        return math.floor((dim_in + 2 * padding - dilation * (kernel - 1) - 1) / stride) + 1

    @staticmethod
    def calculate_pool_output_dim(dim_in: int, kernel: int, stride: int = 2, padding: int = 0) -> int:
        """Calculate spatial dimension for Pooling."""
        return math.floor((dim_in + 2 * padding - kernel) / stride) + 1

    @classmethod
    def calculate_custom_layer(
        cls,
        op_type: str,
        c_in: int,
        c_out: int,
        h_in: int,
        w_in: int,
        kernel_size: int = 3,
        stride: int = 1,
        padding: int = 1,
        dilation: int = 1,
        groups: int = 1,
        has_bias: bool = False,
        batch_size: int = 1,
        precision_bits: int = 32,
        pruning_ratio: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Calculate complete arithmetic, parameter, FLOP, and memory breakdown
        for an arbitrary user-specified layer with full step-by-step formulas.
        """
        bytes_per_elem = precision_bits / 8.0
        op = op_type.upper().strip()

        # Output spatial dimensions
        if "CONV" in op:
            h_out = cls.calculate_conv_output_dim(h_in, kernel_size, stride, padding, dilation)
            w_out = cls.calculate_conv_output_dim(w_in, kernel_size, stride, padding, dilation)
        elif "POOL" in op:
            h_out = cls.calculate_pool_output_dim(h_in, kernel_size, stride, padding)
            w_out = cls.calculate_pool_output_dim(w_in, kernel_size, stride, padding)
            c_out = c_in
        elif "LINEAR" in op or "DENSE" in op:
            h_out = 1
            w_out = 1
        elif "NORM" in op or "RELU" in op or "SILU" in op or "GELU" in op or "DROPOUT" in op or "RESIDUAL" in op:
            h_out = h_in
            w_out = w_in
            c_out = c_in
        else:
            h_out = h_in
            w_out = w_in

        h_out = max(1, h_out)
        w_out = max(1, w_out)

        # Parameters & FLOPs calculation
        weight_params = 0
        bias_params = 0
        macs = 0
        param_formula = ""
        flops_formula = ""

        if "CONV" in op:
            # Grouped / Depthwise check
            effective_groups = groups if groups > 0 else 1
            is_depthwise = (effective_groups == c_in and c_out == c_in)

            weights_per_filter = (c_in // effective_groups) * kernel_size * kernel_size
            weight_params = weights_per_filter * c_out
            bias_params = c_out if has_bias else 0
            
            # MACs = Output_Elements * Operations_Per_Element
            macs = h_out * w_out * weights_per_filter * c_out
            flops = 2 * macs + (h_out * w_out * c_out if has_bias else 0)

            if is_depthwise:
                param_formula = f"Depthwise: (Cin * K * K) = ({c_in} * {kernel_size} * {kernel_size}) = {weight_params:,}"
                flops_formula = f"2 * (Hout * Wout * K * K * Cout) = 2 * ({h_out} * {w_out} * {kernel_size} * {kernel_size} * {c_out}) = {flops:,} FLOPs"
            elif effective_groups > 1:
                param_formula = f"Grouped (G={effective_groups}): ((Cin/G) * K * K * Cout) = (({c_in}/{effective_groups}) * {kernel_size}^2 * {c_out}) = {weight_params:,}"
                flops_formula = f"2 * (Hout * Wout * (Cin/G) * K * K * Cout) = {flops:,} FLOPs"
            else:
                param_formula = f"(Cout * Cin * K * K) + bias = ({c_out} * {c_in} * {kernel_size} * {kernel_size}) + {bias_params} = {weight_params + bias_params:,}"
                flops_formula = f"2 * MACs = 2 * ({h_out} * {w_out} * {c_in} * {kernel_size} * {kernel_size} * {c_out}) = {flops:,} FLOPs"

        elif "LINEAR" in op or "DENSE" in op:
            weight_params = c_in * c_out
            bias_params = c_out if has_bias else 0
            macs = c_in * c_out
            flops = 2 * macs + (c_out if has_bias else 0)
            param_formula = f"(Cin * Cout) + bias = ({c_in} * {c_out}) + {bias_params} = {weight_params + bias_params:,}"
            flops_formula = f"2 * (Cin * Cout) = 2 * ({c_in} * {c_out}) = {flops:,} FLOPs"

        elif "BATCHNORM" in op or "NORM" in op:
            # gamma and beta per channel
            weight_params = c_in  # scale (gamma)
            bias_params = c_in    # shift (beta)
            # 2 FLOPs per element during inference: normalized_x * gamma + beta
            macs = h_in * w_in * c_in
            flops = 2 * h_in * w_in * c_in
            param_formula = f"Scale (gamma) + Shift (beta) = {c_in} + {c_in} = {weight_params + bias_params:,}"
            flops_formula = f"2 * (C * H * W) = 2 * ({c_in} * {h_in} * {w_in}) = {flops:,} FLOPs"

        elif "POOL" in op:
            weight_params = 0
            bias_params = 0
            # Pooling comparison or average: (kernel * kernel) ops per output element
            macs = 0
            flops = h_out * w_out * c_out * (kernel_size * kernel_size)
            param_formula = "0 (Non-parametric spatial pooling)"
            flops_formula = f"Hout * Wout * Cout * (K * K) = {h_out} * {w_out} * {c_out} * ({kernel_size}^2) = {flops:,} FLOPs"

        elif "RELU" in op or "SILU" in op or "ACTIVATION" in op:
            weight_params = 0
            bias_params = 0
            macs = 0
            flops = h_in * w_in * c_in
            param_formula = "0 (Elementwise non-parametric activation)"
            flops_formula = f"1 FLOP per activation element: ({c_in} * {h_in} * {w_in}) = {flops:,} FLOPs"

        elif "RESIDUAL" in op:
            weight_params = 0
            bias_params = 0
            macs = 0
            flops = h_in * w_in * c_in
            param_formula = "0 (Identity elementwise addition)"
            flops_formula = f"1 addition per element: ({c_in} * {h_in} * {w_in}) = {flops:,} FLOPs"

        else:
            weight_params = 0
            bias_params = 0
            macs = 0
            flops = 0
            param_formula = "0"
            flops_formula = "0"

        total_params = weight_params + bias_params

        # Pruning impact on this layer
        if pruning_ratio > 0.0 and total_params > 0:
            remaining_ratio = max(0.05, 1.0 - pruning_ratio)
            pruned_params = int(total_params * remaining_ratio)
            pruned_flops = int(flops * (remaining_ratio ** 1.8 if "CONV" in op else remaining_ratio))
        else:
            pruned_params = total_params
            pruned_flops = flops

        # Memory footprints in Kilobytes (KB)
        # Activation memory = batch_size * (C_out * H_out * W_out) * bytes_per_elem
        activation_elements = batch_size * c_out * h_out * w_out
        activation_memory_kb = round((activation_elements * bytes_per_elem) / 1024.0, 3)

        # Weight memory = total_params * bytes_per_elem
        weight_memory_kb = round((pruned_params * bytes_per_elem) / 1024.0, 3)

        return {
            "op_type": op_type,
            "input_shape": [c_in, h_in, w_in],
            "output_shape": [c_out, h_out, w_out],
            "kernel_size": [kernel_size, kernel_size] if kernel_size > 0 else None,
            "stride": [stride, stride] if stride > 0 else None,
            "padding": [padding, padding],
            "dilation": [dilation, dilation],
            "groups": groups,
            "has_bias": has_bias,
            "weight_params": weight_params,
            "bias_params": bias_params,
            "total_params": total_params,
            "param_formula": param_formula,
            "macs": macs,
            "flops": flops,
            "flops_formula": flops_formula,
            "activation_memory_kb": activation_memory_kb,
            "weight_memory_kb": weight_memory_kb,
            "pruning_ratio": pruning_ratio,
            "pruned_params": pruned_params,
            "pruned_flops": pruned_flops,
            "precision_bits": precision_bits,
        }

    @classmethod
    def get_model_layer_decomposition(
        cls,
        model_name: str,
        input_resolution: Tuple[int, int, int] = (3, 32, 32),
        batch_size: int = 1,
        pruning_ratio: float = 0.0,
        quantization_type: str = "FP32",
    ) -> Dict[str, Any]:
        """
        Generate complete, sequential operational graph for standard CNN architectures.
        Every layer operation (Conv, BN, ReLU, Pooling, Residual, Linear) has exact
        arithmetic calculations, memory usage, and cumulative statistics.
        """
        precision_bits = 32
        if quantization_type == "FP16":
            precision_bits = 16
        elif quantization_type in ["INT8", "INT8_DYNAMIC", "INT8_STATIC"]:
            precision_bits = 8
        elif quantization_type == "INT4":
            precision_bits = 4

        c_in, h_in, w_in = input_resolution
        norm_name = model_name.lower().replace("-", "").replace("_", "")

        raw_layers_specs = []

        # Build architecture templates
        if "resnet18" in norm_name or "resnet-18" in norm_name:
            raw_layers_specs = cls._build_resnet18_specs(c_in, h_in, w_in)
        elif "mobilenet" in norm_name:
            raw_layers_specs = cls._build_mobilenetv2_specs(c_in, h_in, w_in)
        elif "shufflenet" in norm_name:
            raw_layers_specs = cls._build_shufflenetv2_specs(c_in, h_in, w_in)
        elif "vgg16" in norm_name or "vgg-16" in norm_name:
            raw_layers_specs = cls._build_vgg16_specs(c_in, h_in, w_in)
        elif "efficientnet" in norm_name:
            raw_layers_specs = cls._build_efficientnet_specs(c_in, h_in, w_in)
        elif "simplecnn" in norm_name:
            raw_layers_specs = cls._build_simplecnn_specs(c_in, h_in, w_in)
        else:
            # Default to standard ResNet-18
            raw_layers_specs = cls._build_resnet18_specs(c_in, h_in, w_in)

        # Process each layer through calculator and compute cumulative statistics
        processed_layers = []
        cumulative_flops = 0
        cumulative_params = 0
        cumulative_receptive_field = 1
        current_jump = 1

        for idx, spec in enumerate(raw_layers_specs, start=1):
            calculated = cls.calculate_custom_layer(
                op_type=spec["op_type"],
                c_in=spec["c_in"],
                c_out=spec["c_out"],
                h_in=spec["h_in"],
                w_in=spec["w_in"],
                kernel_size=spec.get("kernel_size", 1),
                stride=spec.get("stride", 1),
                padding=spec.get("padding", 0),
                dilation=spec.get("dilation", 1),
                groups=spec.get("groups", 1),
                has_bias=spec.get("has_bias", False),
                batch_size=batch_size,
                precision_bits=precision_bits,
                pruning_ratio=pruning_ratio,
            )

            # Receptive Field Tracking
            k = spec.get("kernel_size", 1)
            s = spec.get("stride", 1)
            if spec["op_type"] in ["Conv2d", "DepthwiseConv2d", "MaxPool2d"]:
                cumulative_receptive_field = cumulative_receptive_field + (k - 1) * current_jump
                current_jump = current_jump * s

            cumulative_flops += calculated["pruned_flops"]
            cumulative_params += calculated["pruned_params"]

            layer_item = {
                "layer_index": idx,
                "name": spec["name"],
                "stage": spec.get("stage", "Backbone"),
                "op_type": spec["op_type"],
                "input_shape": calculated["input_shape"],
                "output_shape": calculated["output_shape"],
                "kernel_size": calculated["kernel_size"],
                "stride": calculated["stride"],
                "padding": calculated["padding"],
                "dilation": calculated["dilation"],
                "groups": calculated["groups"],
                "has_bias": calculated["has_bias"],
                "weight_params": calculated["weight_params"],
                "bias_params": calculated["bias_params"],
                "total_params": calculated["pruned_params"],
                "base_params": calculated["total_params"],
                "param_formula": calculated["param_formula"],
                "macs": calculated["macs"],
                "flops": calculated["pruned_flops"],
                "base_flops": calculated["flops"],
                "flops_formula": calculated["flops_formula"],
                "activation_memory_kb": calculated["activation_memory_kb"],
                "weight_memory_kb": calculated["weight_memory_kb"],
                "receptive_field": cumulative_receptive_field,
                "cumulative_flops": cumulative_flops,
                "cumulative_params": cumulative_params,
                "cumulative_flops_m": round(cumulative_flops / 1e6, 2),
                "cumulative_params_m": round(cumulative_params / 1e6, 3),
            }
            processed_layers.append(layer_item)

        # Calculate percentage contribution per layer
        total_mflops = max(1e-4, cumulative_flops)
        for layer in processed_layers:
            layer["flops_pct"] = round((layer["flops"] / total_mflops) * 100.0, 2)
            layer["cumulative_flops_pct"] = round((layer["cumulative_flops"] / total_mflops) * 100.0, 2)

        total_weight_mem_mb = sum(l["weight_memory_kb"] for l in processed_layers) / 1024.0
        peak_activation_mem_mb = max(l["activation_memory_kb"] for l in processed_layers) / 1024.0
        total_activation_buffer_mb = sum(l["activation_memory_kb"] for l in processed_layers) / 1024.0

        return {
            "model_name": model_name,
            "input_resolution": list(input_resolution),
            "batch_size": batch_size,
            "quantization_type": quantization_type,
            "precision_bits": precision_bits,
            "pruning_ratio": pruning_ratio,
            "total_layers": len(processed_layers),
            "total_parameters": cumulative_params,
            "total_parameters_m": round(cumulative_params / 1e6, 3),
            "total_flops": cumulative_flops,
            "total_flops_m": round(cumulative_flops / 1e6, 2),
            "total_weight_memory_mb": round(total_weight_mem_mb, 3),
            "peak_activation_memory_mb": round(peak_activation_mem_mb, 3),
            "total_activation_buffer_mb": round(total_activation_buffer_mb, 3),
            "layers": processed_layers,
        }

    # ── Architecture Generators ──────────────────────────────────────────────

    @classmethod
    def _build_resnet18_specs(cls, c_in: int, h_in: int, w_in: int) -> List[Dict[str, Any]]:
        """Sequential operation specification for ResNet-18."""
        specs = []
        # Stem
        h, w = h_in, w_in
        # For CIFAR (32x32) stem is typically 3x3 s1 or 7x7 s2 depending on dataset
        stem_k = 3 if h_in <= 32 else 7
        stem_s = 1 if h_in <= 32 else 2
        stem_p = 1 if h_in <= 32 else 3

        specs.append({"name": "conv1", "stage": "Stem", "op_type": "Conv2d", "c_in": c_in, "c_out": 64, "h_in": h, "w_in": w, "kernel_size": stem_k, "stride": stem_s, "padding": stem_p, "has_bias": False})
        h = cls.calculate_conv_output_dim(h, stem_k, stem_s, stem_p)
        w = cls.calculate_conv_output_dim(w, stem_k, stem_s, stem_p)

        specs.append({"name": "bn1", "stage": "Stem", "op_type": "BatchNorm2d", "c_in": 64, "c_out": 64, "h_in": h, "w_in": w})
        specs.append({"name": "relu1", "stage": "Stem", "op_type": "ReLU", "c_in": 64, "c_out": 64, "h_in": h, "w_in": w})

        if h_in > 32:
            specs.append({"name": "maxpool", "stage": "Stem", "op_type": "MaxPool2d", "c_in": 64, "c_out": 64, "h_in": h, "w_in": w, "kernel_size": 3, "stride": 2, "padding": 1})
            h = cls.calculate_pool_output_dim(h, 3, 2, 1)
            w = cls.calculate_pool_output_dim(w, 3, 2, 1)

        # Residual Stages: [2, 2, 2, 2] blocks with channels [64, 128, 256, 512]
        stage_configs = [
            ("Stage 1", 64, 64, 2, 1),
            ("Stage 2", 64, 128, 2, 2),
            ("Stage 3", 128, 256, 2, 2),
            ("Stage 4", 256, 512, 2, 2),
        ]

        curr_c = 64
        for stage_name, in_ch, out_ch, num_blocks, stride in stage_configs:
            for b_idx in range(num_blocks):
                s = stride if b_idx == 0 else 1
                b_prefix = f"{stage_name.lower().replace(' ', '')}.block{b_idx}"

                # Downsample connection if dimension change
                has_downsample = (in_ch != out_ch or s != 1) if b_idx == 0 else False
                if has_downsample:
                    specs.append({"name": f"{b_prefix}.downsample.conv", "stage": stage_name, "op_type": "Conv2d", "c_in": curr_c, "c_out": out_ch, "h_in": h, "w_in": w, "kernel_size": 1, "stride": s, "padding": 0, "has_bias": False})
                    specs.append({"name": f"{b_prefix}.downsample.bn", "stage": stage_name, "op_type": "BatchNorm2d", "c_in": out_ch, "c_out": out_ch, "h_in": cls.calculate_conv_output_dim(h, 1, s, 0), "w_in": cls.calculate_conv_output_dim(w, 1, s, 0)})

                # Conv 1
                specs.append({"name": f"{b_prefix}.conv1", "stage": stage_name, "op_type": "Conv2d", "c_in": curr_c, "c_out": out_ch, "h_in": h, "w_in": w, "kernel_size": 3, "stride": s, "padding": 1, "has_bias": False})
                h = cls.calculate_conv_output_dim(h, 3, s, 1)
                w = cls.calculate_conv_output_dim(w, 3, s, 1)

                specs.append({"name": f"{b_prefix}.bn1", "stage": stage_name, "op_type": "BatchNorm2d", "c_in": out_ch, "c_out": out_ch, "h_in": h, "w_in": w})
                specs.append({"name": f"{b_prefix}.relu1", "stage": stage_name, "op_type": "ReLU", "c_in": out_ch, "c_out": out_ch, "h_in": h, "w_in": w})

                # Conv 2
                specs.append({"name": f"{b_prefix}.conv2", "stage": stage_name, "op_type": "Conv2d", "c_in": out_ch, "c_out": out_ch, "h_in": h, "w_in": w, "kernel_size": 3, "stride": 1, "padding": 1, "has_bias": False})
                specs.append({"name": f"{b_prefix}.bn2", "stage": stage_name, "op_type": "BatchNorm2d", "c_in": out_ch, "c_out": out_ch, "h_in": h, "w_in": w})
                
                # Residual Add & ReLU
                specs.append({"name": f"{b_prefix}.residual_add", "stage": stage_name, "op_type": "ResidualAdd", "c_in": out_ch, "c_out": out_ch, "h_in": h, "w_in": w})
                specs.append({"name": f"{b_prefix}.relu2", "stage": stage_name, "op_type": "ReLU", "c_in": out_ch, "c_out": out_ch, "h_in": h, "w_in": w})

                curr_c = out_ch

        # Classifier Head
        specs.append({"name": "avgpool", "stage": "Classifier", "op_type": "AdaptiveAvgPool2d", "c_in": curr_c, "c_out": curr_c, "h_in": h, "w_in": w, "kernel_size": h, "stride": 1, "padding": 0})
        specs.append({"name": "fc_linear", "stage": "Classifier", "op_type": "Linear", "c_in": curr_c, "c_out": 10 if h_in <= 32 else 1000, "h_in": 1, "w_in": 1, "has_bias": True})

        return specs

    @classmethod
    def _build_mobilenetv2_specs(cls, c_in: int, h_in: int, w_in: int) -> List[Dict[str, Any]]:
        """Sequential operation specification for MobileNetV2 with inverted residuals."""
        specs = []
        h, w = h_in, w_in

        # Stem Conv 3x3 s2
        specs.append({"name": "features.0.conv", "stage": "Stem", "op_type": "Conv2d", "c_in": c_in, "c_out": 32, "h_in": h, "w_in": w, "kernel_size": 3, "stride": 2 if h > 32 else 1, "padding": 1, "has_bias": False})
        h = cls.calculate_conv_output_dim(h, 3, 2 if h > 32 else 1, 1)
        w = cls.calculate_conv_output_dim(w, 3, 2 if w > 32 else 1, 1)
        specs.append({"name": "features.0.bn", "stage": "Stem", "op_type": "BatchNorm2d", "c_in": 32, "c_out": 32, "h_in": h, "w_in": w})
        specs.append({"name": "features.0.relu6", "stage": "Stem", "op_type": "ReLU", "c_in": 32, "c_out": 32, "h_in": h, "w_in": w})

        # Inverted Residual Configs: (expansion_t, out_c, num_blocks, stride_s)
        configs = [
            (1, 16, 1, 1),
            (6, 24, 2, 2 if h > 32 else 1),
            (6, 32, 3, 2),
            (6, 64, 4, 2),
            (6, 96, 3, 1),
            (6, 160, 3, 2),
            (6, 320, 1, 1),
        ]

        curr_c = 32
        block_idx = 1
        for t, out_c, num_blocks, stride in configs:
            for b in range(num_blocks):
                s = stride if b == 0 else 1
                b_name = f"block_{block_idx}"
                hidden_dim = curr_c * t

                # 1. 1x1 Expansion Conv (if t != 1)
                if t != 1:
                    specs.append({"name": f"{b_name}.expand_conv", "stage": f"MBConv-{out_c}", "op_type": "Conv2d", "c_in": curr_c, "c_out": hidden_dim, "h_in": h, "w_in": w, "kernel_size": 1, "stride": 1, "padding": 0, "has_bias": False})
                    specs.append({"name": f"{b_name}.expand_bn", "stage": f"MBConv-{out_c}", "op_type": "BatchNorm2d", "c_in": hidden_dim, "c_out": hidden_dim, "h_in": h, "w_in": w})
                    specs.append({"name": f"{b_name}.expand_relu6", "stage": f"MBConv-{out_c}", "op_type": "ReLU", "c_in": hidden_dim, "c_out": hidden_dim, "h_in": h, "w_in": w})

                # 2. 3x3 Depthwise Conv (groups = hidden_dim)
                specs.append({"name": f"{b_name}.depthwise_conv", "stage": f"MBConv-{out_c}", "op_type": "DepthwiseConv2d", "c_in": hidden_dim, "c_out": hidden_dim, "h_in": h, "w_in": w, "kernel_size": 3, "stride": s, "padding": 1, "groups": hidden_dim, "has_bias": False})
                h = cls.calculate_conv_output_dim(h, 3, s, 1)
                w = cls.calculate_conv_output_dim(w, 3, s, 1)
                specs.append({"name": f"{b_name}.depthwise_bn", "stage": f"MBConv-{out_c}", "op_type": "BatchNorm2d", "c_in": hidden_dim, "c_out": hidden_dim, "h_in": h, "w_in": w})
                specs.append({"name": f"{b_name}.depthwise_relu6", "stage": f"MBConv-{out_c}", "op_type": "ReLU", "c_in": hidden_dim, "c_out": hidden_dim, "h_in": h, "w_in": w})

                # 3. 1x1 Pointwise Linear Projection (no activation!)
                specs.append({"name": f"{b_name}.project_conv", "stage": f"MBConv-{out_c}", "op_type": "Conv2d", "c_in": hidden_dim, "c_out": out_c, "h_in": h, "w_in": w, "kernel_size": 1, "stride": 1, "padding": 0, "has_bias": False})
                specs.append({"name": f"{b_name}.project_bn", "stage": f"MBConv-{out_c}", "op_type": "BatchNorm2d", "c_in": out_c, "c_out": out_c, "h_in": h, "w_in": w})

                if s == 1 and curr_c == out_c:
                    specs.append({"name": f"{b_name}.residual_add", "stage": f"MBConv-{out_c}", "op_type": "ResidualAdd", "c_in": out_c, "c_out": out_c, "h_in": h, "w_in": w})

                curr_c = out_c
                block_idx += 1

        # Final 1x1 Conv + Classifier
        specs.append({"name": "conv_head", "stage": "Classifier", "op_type": "Conv2d", "c_in": curr_c, "c_out": 1280, "h_in": h, "w_in": w, "kernel_size": 1, "stride": 1, "padding": 0, "has_bias": False})
        specs.append({"name": "bn_head", "stage": "Classifier", "op_type": "BatchNorm2d", "c_in": 1280, "c_out": 1280, "h_in": h, "w_in": w})
        specs.append({"name": "relu_head", "stage": "Classifier", "op_type": "ReLU", "c_in": 1280, "c_out": 1280, "h_in": h, "w_in": w})
        specs.append({"name": "avgpool", "stage": "Classifier", "op_type": "AdaptiveAvgPool2d", "c_in": 1280, "c_out": 1280, "h_in": h, "w_in": w, "kernel_size": h, "stride": 1, "padding": 0})
        specs.append({"name": "classifier", "stage": "Classifier", "op_type": "Linear", "c_in": 1280, "c_out": 10 if h_in <= 32 else 1000, "h_in": 1, "w_in": 1, "has_bias": True})

        return specs

    @classmethod
    def _build_simplecnn_specs(cls, c_in: int, h_in: int, w_in: int) -> List[Dict[str, Any]]:
        """Compact 4-layer CNN for prototyping."""
        specs = []
        h, w = h_in, w_in

        # Layer 1
        specs.append({"name": "conv1", "stage": "Block 1", "op_type": "Conv2d", "c_in": c_in, "c_out": 32, "h_in": h, "w_in": w, "kernel_size": 3, "stride": 1, "padding": 1, "has_bias": True})
        h = cls.calculate_conv_output_dim(h, 3, 1, 1)
        w = cls.calculate_conv_output_dim(w, 3, 1, 1)
        specs.append({"name": "bn1", "stage": "Block 1", "op_type": "BatchNorm2d", "c_in": 32, "c_out": 32, "h_in": h, "w_in": w})
        specs.append({"name": "relu1", "stage": "Block 1", "op_type": "ReLU", "c_in": 32, "c_out": 32, "h_in": h, "w_in": w})
        specs.append({"name": "pool1", "stage": "Block 1", "op_type": "MaxPool2d", "c_in": 32, "c_out": 32, "h_in": h, "w_in": w, "kernel_size": 2, "stride": 2, "padding": 0})
        h = cls.calculate_pool_output_dim(h, 2, 2, 0)
        w = cls.calculate_pool_output_dim(w, 2, 2, 0)

        # Layer 2
        specs.append({"name": "conv2", "stage": "Block 2", "op_type": "Conv2d", "c_in": 32, "c_out": 64, "h_in": h, "w_in": w, "kernel_size": 3, "stride": 1, "padding": 1, "has_bias": True})
        h = cls.calculate_conv_output_dim(h, 3, 1, 1)
        w = cls.calculate_conv_output_dim(w, 3, 1, 1)
        specs.append({"name": "bn2", "stage": "Block 2", "op_type": "BatchNorm2d", "c_in": 64, "c_out": 64, "h_in": h, "w_in": w})
        specs.append({"name": "relu2", "stage": "Block 2", "op_type": "ReLU", "c_in": 64, "c_out": 64, "h_in": h, "w_in": w})
        specs.append({"name": "pool2", "stage": "Block 2", "op_type": "MaxPool2d", "c_in": 64, "c_out": 64, "h_in": h, "w_in": w, "kernel_size": 2, "stride": 2, "padding": 0})
        h = cls.calculate_pool_output_dim(h, 2, 2, 0)
        w = cls.calculate_pool_output_dim(w, 2, 2, 0)

        # Layer 3
        specs.append({"name": "conv3", "stage": "Block 3", "op_type": "Conv2d", "c_in": 64, "c_out": 128, "h_in": h, "w_in": w, "kernel_size": 3, "stride": 1, "padding": 1, "has_bias": True})
        h = cls.calculate_conv_output_dim(h, 3, 1, 1)
        w = cls.calculate_conv_output_dim(w, 3, 1, 1)
        specs.append({"name": "bn3", "stage": "Block 3", "op_type": "BatchNorm2d", "c_in": 128, "c_out": 128, "h_in": h, "w_in": w})
        specs.append({"name": "relu3", "stage": "Block 3", "op_type": "ReLU", "c_in": 128, "c_out": 128, "h_in": h, "w_in": w})

        # Classifier
        specs.append({"name": "adaptive_pool", "stage": "Classifier", "op_type": "AdaptiveAvgPool2d", "c_in": 128, "c_out": 128, "h_in": h, "w_in": w, "kernel_size": h, "stride": 1, "padding": 0})
        specs.append({"name": "fc1", "stage": "Classifier", "op_type": "Linear", "c_in": 128, "c_out": 256, "h_in": 1, "w_in": 1, "has_bias": True})
        specs.append({"name": "fc1_relu", "stage": "Classifier", "op_type": "ReLU", "c_in": 256, "c_out": 256, "h_in": 1, "w_in": 1})
        specs.append({"name": "fc2_out", "stage": "Classifier", "op_type": "Linear", "c_in": 256, "c_out": 10, "h_in": 1, "w_in": 1, "has_bias": True})

        return specs

    @classmethod
    def _build_vgg16_specs(cls, c_in: int, h_in: int, w_in: int) -> List[Dict[str, Any]]:
        """Homogeneous 3x3 Conv VGG-16 layout."""
        specs = []
        h, w = h_in, w_in
        vgg_plan = [
            ("Block 1", [64, 64]),
            ("Block 2", [128, 128]),
            ("Block 3", [256, 256, 256]),
            ("Block 4", [512, 512, 512]),
            ("Block 5", [512, 512, 512]),
        ]

        curr_c = c_in
        for block_name, channels in vgg_plan:
            for sub_i, out_c in enumerate(channels, start=1):
                c_name = f"{block_name.lower().replace(' ', '')}_conv{sub_i}"
                specs.append({"name": c_name, "stage": block_name, "op_type": "Conv2d", "c_in": curr_c, "c_out": out_c, "h_in": h, "w_in": w, "kernel_size": 3, "stride": 1, "padding": 1, "has_bias": True})
                h = cls.calculate_conv_output_dim(h, 3, 1, 1)
                w = cls.calculate_conv_output_dim(w, 3, 1, 1)
                specs.append({"name": f"{c_name}_relu", "stage": block_name, "op_type": "ReLU", "c_in": out_c, "c_out": out_c, "h_in": h, "w_in": w})
                curr_c = out_c

            # MaxPool at end of block
            specs.append({"name": f"{block_name.lower().replace(' ', '')}_pool", "stage": block_name, "op_type": "MaxPool2d", "c_in": curr_c, "c_out": curr_c, "h_in": h, "w_in": w, "kernel_size": 2, "stride": 2, "padding": 0})
            h = cls.calculate_pool_output_dim(h, 2, 2, 0)
            w = cls.calculate_pool_output_dim(w, 2, 2, 0)

        # Classifier
        specs.append({"name": "fc1", "stage": "Classifier", "op_type": "Linear", "c_in": curr_c * max(1, h) * max(1, w), "c_out": 512 if h_in <= 32 else 4096, "h_in": 1, "w_in": 1, "has_bias": True})
        specs.append({"name": "fc1_relu", "stage": "Classifier", "op_type": "ReLU", "c_in": 512 if h_in <= 32 else 4096, "c_out": 512 if h_in <= 32 else 4096, "h_in": 1, "w_in": 1})
        specs.append({"name": "fc2_out", "stage": "Classifier", "op_type": "Linear", "c_in": 512 if h_in <= 32 else 4096, "c_out": 10 if h_in <= 32 else 1000, "h_in": 1, "w_in": 1, "has_bias": True})

        return specs

    @classmethod
    def _build_shufflenetv2_specs(cls, c_in: int, h_in: int, w_in: int) -> List[Dict[str, Any]]:
        """ShuffleNetV2 channel split and shuffle architecture."""
        specs = []
        h, w = h_in, w_in

        # Conv1
        specs.append({"name": "conv1", "stage": "Stem", "op_type": "Conv2d", "c_in": c_in, "c_out": 24, "h_in": h, "w_in": w, "kernel_size": 3, "stride": 2 if h > 32 else 1, "padding": 1, "has_bias": False})
        h = cls.calculate_conv_output_dim(h, 3, 2 if h > 32 else 1, 1)
        w = cls.calculate_conv_output_dim(w, 3, 2 if w > 32 else 1, 1)
        specs.append({"name": "bn1", "stage": "Stem", "op_type": "BatchNorm2d", "c_in": 24, "c_out": 24, "h_in": h, "w_in": w})
        specs.append({"name": "relu1", "stage": "Stem", "op_type": "ReLU", "c_in": 24, "c_out": 24, "h_in": h, "w_in": w})

        # Stages: (out_channels, repeats)
        stages = [
            ("Stage 2", 116, 4),
            ("Stage 3", 232, 8),
            ("Stage 4", 464, 4),
        ]

        curr_c = 24
        for stage_name, out_ch, repeats in stages:
            for rep in range(repeats):
                s = 2 if rep == 0 and h > 8 else 1
                b_name = f"{stage_name.lower().replace(' ', '')}_b{rep}"
                branch_ch = out_ch // 2

                # 1x1 Conv
                specs.append({"name": f"{b_name}_conv1", "stage": stage_name, "op_type": "Conv2d", "c_in": curr_c if rep == 0 else branch_ch, "c_out": branch_ch, "h_in": h, "w_in": w, "kernel_size": 1, "stride": 1, "padding": 0, "has_bias": False})
                specs.append({"name": f"{b_name}_bn1", "stage": stage_name, "op_type": "BatchNorm2d", "c_in": branch_ch, "c_out": branch_ch, "h_in": h, "w_in": w})
                specs.append({"name": f"{b_name}_relu1", "stage": stage_name, "op_type": "ReLU", "c_in": branch_ch, "c_out": branch_ch, "h_in": h, "w_in": w})

                # 3x3 Depthwise Conv
                specs.append({"name": f"{b_name}_dwconv", "stage": stage_name, "op_type": "DepthwiseConv2d", "c_in": branch_ch, "c_out": branch_ch, "h_in": h, "w_in": w, "kernel_size": 3, "stride": s, "padding": 1, "groups": branch_ch, "has_bias": False})
                h = cls.calculate_conv_output_dim(h, 3, s, 1)
                w = cls.calculate_conv_output_dim(w, 3, s, 1)
                specs.append({"name": f"{b_name}_dwbn", "stage": stage_name, "op_type": "BatchNorm2d", "c_in": branch_ch, "c_out": branch_ch, "h_in": h, "w_in": w})

                # 1x1 Conv
                specs.append({"name": f"{b_name}_conv2", "stage": stage_name, "op_type": "Conv2d", "c_in": branch_ch, "c_out": branch_ch, "h_in": h, "w_in": w, "kernel_size": 1, "stride": 1, "padding": 0, "has_bias": False})
                specs.append({"name": f"{b_name}_bn2", "stage": stage_name, "op_type": "BatchNorm2d", "c_in": branch_ch, "c_out": branch_ch, "h_in": h, "w_in": w})
                specs.append({"name": f"{b_name}_relu2", "stage": stage_name, "op_type": "ReLU", "c_in": branch_ch, "c_out": branch_ch, "h_in": h, "w_in": w})

                curr_c = out_ch

        # Conv5 + Classifier
        specs.append({"name": "conv5", "stage": "Classifier", "op_type": "Conv2d", "c_in": curr_c, "c_out": 1024, "h_in": h, "w_in": w, "kernel_size": 1, "stride": 1, "padding": 0, "has_bias": False})
        specs.append({"name": "bn5", "stage": "Classifier", "op_type": "BatchNorm2d", "c_in": 1024, "c_out": 1024, "h_in": h, "w_in": w})
        specs.append({"name": "relu5", "stage": "Classifier", "op_type": "ReLU", "c_in": 1024, "c_out": 1024, "h_in": h, "w_in": w})
        specs.append({"name": "avgpool", "stage": "Classifier", "op_type": "AdaptiveAvgPool2d", "c_in": 1024, "c_out": 1024, "h_in": h, "w_in": w, "kernel_size": h, "stride": 1, "padding": 0})
        specs.append({"name": "fc", "stage": "Classifier", "op_type": "Linear", "c_in": 1024, "c_out": 10 if h_in <= 32 else 1000, "h_in": 1, "w_in": 1, "has_bias": True})

        return specs

    @classmethod
    def _build_efficientnet_specs(cls, c_in: int, h_in: int, w_in: int) -> List[Dict[str, Any]]:
        """EfficientNet-B0 compound scaled baseline."""
        specs = []
        h, w = h_in, w_in

        # Stem Conv 3x3
        specs.append({"name": "features.0.conv", "stage": "Stem", "op_type": "Conv2d", "c_in": c_in, "c_out": 32, "h_in": h, "w_in": w, "kernel_size": 3, "stride": 2 if h > 32 else 1, "padding": 1, "has_bias": False})
        h = cls.calculate_conv_output_dim(h, 3, 2 if h > 32 else 1, 1)
        w = cls.calculate_conv_output_dim(w, 3, 2 if w > 32 else 1, 1)
        specs.append({"name": "features.0.bn", "stage": "Stem", "op_type": "BatchNorm2d", "c_in": 32, "c_out": 32, "h_in": h, "w_in": w})
        specs.append({"name": "features.0.silu", "stage": "Stem", "op_type": "SiLU", "c_in": 32, "c_out": 32, "h_in": h, "w_in": w})

        # MBConv blocks
        mb_configs = [
            (1, 16, 1, 3, 1),
            (6, 24, 2, 3, 2 if h > 16 else 1),
            (6, 40, 2, 5, 2),
            (6, 80, 3, 3, 2),
            (6, 112, 3, 5, 1),
            (6, 192, 4, 5, 2),
            (6, 320, 1, 3, 1),
        ]

        curr_c = 32
        block_idx = 1
        for expand_ratio, out_c, num_layers, kernel, stride in mb_configs:
            for l_idx in range(num_layers):
                s = stride if l_idx == 0 else 1
                b_name = f"mbconv_{block_idx}"
                hidden_dim = curr_c * expand_ratio

                if expand_ratio != 1:
                    specs.append({"name": f"{b_name}.expand_conv", "stage": f"MBConv-{out_c}", "op_type": "Conv2d", "c_in": curr_c, "c_out": hidden_dim, "h_in": h, "w_in": w, "kernel_size": 1, "stride": 1, "padding": 0, "has_bias": False})
                    specs.append({"name": f"{b_name}.expand_bn", "stage": f"MBConv-{out_c}", "op_type": "BatchNorm2d", "c_in": hidden_dim, "c_out": hidden_dim, "h_in": h, "w_in": w})
                    specs.append({"name": f"{b_name}.expand_silu", "stage": f"MBConv-{out_c}", "op_type": "SiLU", "c_in": hidden_dim, "c_out": hidden_dim, "h_in": h, "w_in": w})

                specs.append({"name": f"{b_name}.dwconv", "stage": f"MBConv-{out_c}", "op_type": "DepthwiseConv2d", "c_in": hidden_dim, "c_out": hidden_dim, "h_in": h, "w_in": w, "kernel_size": kernel, "stride": s, "padding": kernel // 2, "groups": hidden_dim, "has_bias": False})
                h = cls.calculate_conv_output_dim(h, kernel, s, kernel // 2)
                w = cls.calculate_conv_output_dim(w, kernel, s, kernel // 2)
                specs.append({"name": f"{b_name}.dwbn", "stage": f"MBConv-{out_c}", "op_type": "BatchNorm2d", "c_in": hidden_dim, "c_out": hidden_dim, "h_in": h, "w_in": w})
                specs.append({"name": f"{b_name}.dwsilu", "stage": f"MBConv-{out_c}", "op_type": "SiLU", "c_in": hidden_dim, "c_out": hidden_dim, "h_in": h, "w_in": w})

                specs.append({"name": f"{b_name}.project_conv", "stage": f"MBConv-{out_c}", "op_type": "Conv2d", "c_in": hidden_dim, "c_out": out_c, "h_in": h, "w_in": w, "kernel_size": 1, "stride": 1, "padding": 0, "has_bias": False})
                specs.append({"name": f"{b_name}.project_bn", "stage": f"MBConv-{out_c}", "op_type": "BatchNorm2d", "c_in": out_c, "c_out": out_c, "h_in": h, "w_in": w})

                if s == 1 and curr_c == out_c:
                    specs.append({"name": f"{b_name}.residual_add", "stage": f"MBConv-{out_c}", "op_type": "ResidualAdd", "c_in": out_c, "c_out": out_c, "h_in": h, "w_in": w})

                curr_c = out_c
                block_idx += 1

        # Head Conv 1x1 + Classifier
        specs.append({"name": "conv_head", "stage": "Classifier", "op_type": "Conv2d", "c_in": curr_c, "c_out": 1280, "h_in": h, "w_in": w, "kernel_size": 1, "stride": 1, "padding": 0, "has_bias": False})
        specs.append({"name": "bn_head", "stage": "Classifier", "op_type": "BatchNorm2d", "c_in": 1280, "c_out": 1280, "h_in": h, "w_in": w})
        specs.append({"name": "silu_head", "stage": "Classifier", "op_type": "SiLU", "c_in": 1280, "c_out": 1280, "h_in": h, "w_in": w})
        specs.append({"name": "avgpool", "stage": "Classifier", "op_type": "AdaptiveAvgPool2d", "c_in": 1280, "c_out": 1280, "h_in": h, "w_in": w, "kernel_size": h, "stride": 1, "padding": 0})
        specs.append({"name": "classifier", "stage": "Classifier", "op_type": "Linear", "c_in": 1280, "c_out": 10 if h_in <= 32 else 1000, "h_in": 1, "w_in": 1, "has_bias": True})

        return specs
