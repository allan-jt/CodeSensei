INFRA = ./infrastructure
FRONTEND = ./frontend

REACT_APP = ${FRONTEND}/lib/react-app
DYNAMO_DATA = ${INFRA}/lib/storage/dynamo-stack/scripts

I_CMD = cd ${INFRA} && cdk
F_CMD = cd ${FRONTEND} && cdk


deploy_infra:
	${I_CMD} deploy --all --require-approval never

deploy_frontend:
	${F_CMD} deploy --all --require-approval never

run_frontend_local:
	cd ${REACT_APP} && npm run dev

build_frontend:
	cd ${REACT_APP} && npm run build

gen_frontend_env:
	cd ${FRONTEND} && npx ts-node generate-env.ts

destroy_infra:
	${I_CMD} destroy --all --require-approval never

destroy_frontend:
	${F_CMD} destroy --all --require-approval never

destroy_all: destroy_frontend destroy_infra

destroy_all_prune: destroy_all prune

seed_dynamo:
	cd ${DYNAMO_DATA} && npx ts-node seed-dynamo.ts $(filter-out $@,$(MAKECMDGOALS))

seed_opensearch:
	aws lambda invoke \
		--function-name LambdaForOpenSearchService \
		--payload '{"action": "seed"}' \
		--cli-binary-format raw-in-base64-out \
		--output text \
		--query 'Payload' \
		response.json && cat response.json && rm response.json

%:
	@:

